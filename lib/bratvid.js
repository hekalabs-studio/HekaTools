const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { makeBratImageAsync } = require("./bratCanvasAsync");
const { resolveBinary } = require("./binaries");
const { spawnWithTimeout } = require("./spawnWithTimeout");
const { isLowSpec } = require("./systemSpecs");

const TMP_DIR = path.join(__dirname, "..", "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Operasi ini cuma nggabungin beberapa frame PNG kecil jadi mp4 pendek -- harusnya cepat,
// 2 menit udah sangat longgar buat jaga-jaga sebelum dianggap macet.
const BRATVID_FFMPEG_TIMEOUT_MS = 2 * 60 * 1000;

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const { proc, isTimedOut } = spawnWithTimeout(resolveBinary("ffmpeg"), args, { timeoutMs: BRATVID_FFMPEG_TIMEOUT_MS });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (isTimedOut()) return reject(new Error(`FFmpeg kelamaan/macet (lebih dari ${BRATVID_FFMPEG_TIMEOUT_MS / 1000}s), proses dipaksa berhenti.`));
      code === 0 ? resolve() : reject(new Error("FFmpeg gagal: " + stderr.slice(-500)));
    });
  });
}

/**
 * Bikin video pendek (mp4) yang nampilin teks "brat" muncul kata demi kata,
 * buat dijadiin sticker animasi (bratvid).
 */
async function makeBratVideo(text, { bgColor = "#FFFFFF" } = {}) {
  const maxWords = isLowSpec() ? 12 : 25;
  const words = String(text).trim().split(/\s+/).slice(0, maxWords);
  const id = crypto.randomBytes(6).toString("hex");
  const frameDir = path.join(TMP_DIR, `brat_${id}`);
  fs.mkdirSync(frameDir, { recursive: true });

  const steps = Math.max(words.length, 1);
  const progressivePrompts = [];
  for (let i = 0; i < steps; i++) progressivePrompts.push(words.slice(0, i + 1).join(" "));

  const outputFile = path.join(TMP_DIR, `brat_${id}.mp4`);

  try {
    let frameBuffers = [];
    let lastBuf;

    if (isLowSpec()) {
      // Pada low-spec (Celeron / RAM 2GB), render frame secara bertahap
      // agar memori Canvas Skia tidak menumpuk dan CPU tidak 100%
      for (const prompt of progressivePrompts) {
        const buf = await makeBratImageAsync(prompt, { bgColor });
        frameBuffers.push(buf);
      }
      lastBuf = await makeBratImageAsync(words.join(" "), { bgColor });
    } else {
      [frameBuffers, lastBuf] = await Promise.all([
        Promise.all(progressivePrompts.map((prompt) => makeBratImageAsync(prompt, { bgColor }))),
        makeBratImageAsync(text, { bgColor }),
      ]);
    }

    frameBuffers.forEach((buf, i) => {
      fs.writeFileSync(path.join(frameDir, `f${String(i).padStart(3, "0")}.png`), buf);
    });
    // ulang frame terakhir beberapa kali biar ada jeda sebelum sticker loop
    for (let i = 0; i < 3; i++) {
      fs.writeFileSync(path.join(frameDir, `f${String(steps + i).padStart(3, "0")}.png`), lastBuf);
    }

    const ffmpegArgs = [
      "-y", "-framerate", "2",
      "-i", path.join(frameDir, "f%03d.png"),
      "-vf", "scale=512:512", "-pix_fmt", "yuv420p",
      "-preset", "ultrafast",
      ...(isLowSpec() ? ["-threads", "1"] : []),
      outputFile,
    ];

    await runFfmpeg(ffmpegArgs);

    const buffer = fs.readFileSync(outputFile);
    if (isLowSpec() && global.gc) {
      try { global.gc(); } catch {}
    }
    return buffer;
  } finally {
    fs.rmSync(frameDir, { recursive: true, force: true });
    fs.rmSync(outputFile, { force: true });
  }
}

module.exports = { makeBratVideo };
