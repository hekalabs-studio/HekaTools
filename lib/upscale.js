const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { resolveBinary } = require("./binaries");
const { spawnWithTimeout } = require("./spawnWithTimeout");

const TMP_DIR = path.join(__dirname, "..", "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// AI upscale bisa makan waktu lumayan buat gambar gede, tapi tetap harus ada batas -- kalau
// macet gara-gara driver GPU/Vulkan bermasalah, jangan sampai nunggu selamanya.
const UPSCALE_TIMEOUT_MS = 3 * 60 * 1000;

function detectExt(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  return "png";
}

/**
 * Upscale/HD-kan gambar secara LOKAL pakai Real-ESRGAN (realesrgan-ncnn-vulkan),
 * AI upscaler open-source. Gak butuh API luar sama sekali.
 *
 * @param {Buffer} inputBuffer
 * @param {{model?: string, scale?: number}} opts
 *   model: "realesrgan-x4plus" (foto umum, default), "realesrgan-x4plus-anime" (anime/kartun),
 *          "realesrnet-x4plus" (lebih halus, kurang tajam)
 *
 * CATATAN PENTING soal `scale`: model x4plus/x4plus-anime/x4plus-anime dilatih (trained) HANYA
 * buat scale 4x -- itu satu-satunya scale "asli" yang didukung model-nya. Kalau binary
 * realesrgan-ncnn-vulkan dikasih flag `-s 2` atau `-s 3`, dia TETAP jalanin model yang sama di
 * 4x secara internal, lalu resize hasilnya ke scale yang diminta -- dan jalur resize non-4x
 * internal ini punya bug tiling/seam yang cukup dikenal di banyak versi ncnn-vulkan, terutama
 * di GPU dengan VRAM kecil/driver terbatas (misal GPU mobile lewat proot) yang meng-otomatis
 * tiling gambar jadi potongan kecil -- hasil re-assembly antar tile-nya berantakan (kotak-kotak
 * geser kayak yang muncul kalau kamu pernah coba `.hdr 2`/`.hdr 3` dan hasilnya pecah, padahal
 * `.hdr` default/4x mulus).
 *
 * FIX: binary SELALU dijalankan di scale native 4x (jalur yang teruji bersih), lalu kalau user
 * minta scale selain 4, resize manual dilakukan DI SINI pakai sharp (bukan ngandelin resize
 * internal binary yang buggy). Hasilnya tetap tajam (based on hasil 4x asli) dan gak ada
 * artefak tiling, di scale berapapun yang diminta.
 */
async function upscaleImage(inputBuffer, { model = "realesrgan-x4plus", scale = 4 } = {}) {
  const bin = resolveBinary("realesrgan-ncnn-vulkan");
  const binDir = path.dirname(bin);
  const id = crypto.randomBytes(6).toString("hex");
  const inputExt = detectExt(inputBuffer);
  const inputFile = path.join(TMP_DIR, `${id}.${inputExt}`);
  const outputFile = path.join(TMP_DIR, `${id}_out.png`);

  fs.writeFileSync(inputFile, inputBuffer);

  try {
    await new Promise((resolve, reject) => {
      const { proc, isTimedOut } = spawnWithTimeout(
        bin,
        // "-s", "4" -- SELALU 4 (native), TIDAK PERNAH pakai `scale` dari parameter di sini.
        // Lihat catatan panjang di atas kenapa: resize ke scale lain dilakukan manual di bawah.
        ["-i", inputFile, "-o", outputFile, "-n", model, "-s", "4"],
        { timeoutMs: UPSCALE_TIMEOUT_MS, spawnOptions: { cwd: fs.existsSync(binDir) ? binDir : undefined } }
      );
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", (err) => {
        const releaseAsset =
          process.platform === "win32" ? "-windows.zip" : process.platform === "darwin" ? "-macos.zip" : "-ubuntu.zip";
        reject(
          new Error(
            "Real-ESRGAN tidak ditemukan (opsional -- fitur ini tetap jalan via fallback PicsArt online).\n" +
            "Cara install LOKAL (gak butuh API, lebih cepat & gratis kalau device kamu punya GPU/Vulkan):\n" +
            `1. Download dari https://github.com/xinntao/Real-ESRGAN/releases (pilih file "${releaseAsset}")\n` +
            "2. Extract SEMUA isinya (binary + folder models + file .param/.bin) ke folder `bin/` di project ini\n" +
            "   (jangan cuma binary-nya doang, folder `models` di sebelahnya juga wajib ikut di-copy)\n" +
            "Detail: " + err.message
          )
        );
      });
      proc.on("close", (code) => {
        if (isTimedOut()) {
          return reject(new Error(`Real-ESRGAN kelamaan/macet (lebih dari ${UPSCALE_TIMEOUT_MS / 1000}s), proses dipaksa berhenti. Kemungkinan driver GPU/Vulkan bermasalah, atau gambarnya kebesaran.`));
        }
        if (code === 0) resolve();
        else reject(new Error("Real-ESRGAN gagal: " + stderr.slice(-500)));
      });
    });

    if (!fs.existsSync(outputFile)) throw new Error("Hasil upscale tidak ditemukan.");
    const rawOutput = fs.readFileSync(outputFile);

    // Scale 4 (default) -- hasil native binary langsung dipakai, gak perlu resize tambahan.
    if (scale === 4) return rawOutput;

    // Scale selain 4 -- resize manual dari hasil 4x yang bersih, BUKAN ngandelin binary.
    const { width: origWidth, height: origHeight } = await sharp(inputBuffer).metadata();
    const targetWidth = Math.round(origWidth * scale);
    const targetHeight = Math.round(origHeight * scale);
    return await sharp(rawOutput).resize(targetWidth, targetHeight, { fit: "fill" }).png().toBuffer();
  } finally {
    // PENTING: sebelumnya cleanup ini cuma ada di jalur SUKSES (di akhir fungsi) -- kalau
    // Real-ESRGAN gagal (proses error/exit code bukan 0/output gak ketemu), function-nya
    // langsung `throw` dan inputFile (+ outputFile kalau sempat kebuat) KETINGGALAN selamanya
    // di folder tmp/, gak pernah kehapus. Dibungkus try/finally biar cleanup SELALU jalan,
    // sukses maupun gagal -- sama kayak pola yang udah dipakai konsisten di lib/ffmpeg.js dkk.
    fs.rmSync(inputFile, { force: true });
    fs.rmSync(outputFile, { force: true });
  }
}

module.exports = { upscaleImage };
