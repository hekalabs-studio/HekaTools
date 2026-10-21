const axios = require("axios");
const FormData = require("form-data");

/**
 * Upscale gambar via PicsArt AI Enhancement (REALESERGAN model + face enhancement) --
 * layanan online GRATIS & PUBLIK dari picsart.com, gak butuh API key/login/pembayaran.
 *
 * KENAPA INI DIPAKAI (bukan API "waifu2x" yang tadinya dicoba):
 * Semua provider aggregator gratis (siputzx, ryzendesu, agatz, skizo, dst) yang punya endpoint
 * "waifu2x"/"upscale" TERNYATA cuma proxy/scraper ke layanan PicsArt ini juga di belakang layar
 * (lihat source siputzx: https://github.com/siputzx/apisku/blob/master/router/tools/upscale.ts).
 * Jadi daripada gantung ke uptime/routing provider aggregator pihak ketiga yang sering
 * berubah/rusak/gak sinkron sama repo publiknya, kita panggil PicsArt-nya LANGSUNG dari sini --
 * lebih reliable karena gak ada lapisan proxy tambahan yang bisa down duluan.
 *
 * Alur kerja (di-reverse-engineer dari halaman web picsart.com/image-upscale):
 * 1. Ambil auth token sementara dari bundle JS picsart.com (token ini publik, dipakai halaman
 *    web picsart.com sendiri buat visitor anonim -- BUKAN kredensial rahasia siapapun)
 * 2. Upload gambar ke upload.picsart.com pakai token itu, dapet URL sementara
 * 3. Kirim URL itu ke endpoint AI enhancement (ai.picsart.com), dapet job ID
 * 4. Poll status job itu sampai selesai ("DONE"), lalu download hasilnya
 *
 * CATATAN: ini layanan pihak ketiga (bukan API resmi buat developer) -- kalau picsart.com
 * suatu saat ubah struktur halaman/endpoint-nya, fungsi ini bisa berhenti jalan. Kalau itu
 * terjadi, cek lagi apakah masih ada token yg ke-extract dari getAuthToken().
 */

const ENHANCE_TIMEOUT_MS = 3 * 60 * 1000; // 3 menit, sama kayak batas upscale lokal (Real-ESRGAN)
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36";

const UPLOAD_URL = "https://upload.picsart.com/files";
const ENHANCE_URL = "https://ai.picsart.com/gw1/diffbir-enhancement-service/v1.7.6";
const JS_BUNDLE_URL = "https://picsart.com/-/landings/4.290.0/static/index-msH24PNW-B73n3SC9.js";

async function getAuthToken() {
  const res = await axios.get(JS_BUNDLE_URL, { headers: { "User-Agent": UA }, timeout: 20000 });
  const match = String(res.data).match(/"x-app-authorization":"Bearer ([^"]+)"/);
  if (!match) {
    throw new Error(
      "Token PicsArt tidak ketemu di bundle JS -- kemungkinan picsart.com sudah ganti struktur " +
      "halamannya (nama file bundle JS berubah tiap mereka deploy versi baru situsnya)."
    );
  }
  return `Bearer ${match[1]}`;
}

async function uploadBuffer(buffer, authToken) {
  const form = new FormData();
  form.append("type", "editing-temp-landings");
  form.append("file", buffer, { filename: "image.jpeg", contentType: "image/jpeg" });
  form.append("url", "");
  form.append("metainfo", "");

  const res = await axios.post(UPLOAD_URL, form, {
    headers: { ...form.getHeaders(), "x-app-authorization": authToken, "User-Agent": UA, Origin: "https://picsart.com" },
    timeout: 30000,
  });
  return res.data.result.url;
}

async function enhanceImage(imageUrl, authToken, targetScale) {
  const scale = Math.max(1, Math.min(20, targetScale));
  const params = new URLSearchParams({ picsart_cdn_url: imageUrl, format: "PNG", model: "REALESERGAN" });
  const payload = {
    image_url: imageUrl,
    colour_correction: { enabled: false, blending: 0.5 },
    face_enhancement: { enabled: true, blending: 1, max_faces: 1000, impression: false, gfpgan: true, node: "ada" },
    seed: 42,
    upscale: { enabled: true, node: "esrgan", target_scale: scale },
  };

  const res = await axios.post(`${ENHANCE_URL}?${params.toString()}`, payload, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: "https://picsart.com",
      Referer: "https://picsart.com/",
      "User-Agent": UA,
      "x-app-authorization": authToken,
      "x-touchpoint": "widget_EnhancedImage",
    },
    timeout: 30000,
  });
  return res.data;
}

async function checkStatus(jobId, authToken) {
  const res = await axios.get(`${ENHANCE_URL}/${jobId}`, {
    headers: { Accept: "application/json", Origin: "https://picsart.com", "User-Agent": UA, "x-app-authorization": authToken },
    timeout: 20000,
  });
  return res.data;
}

async function waitForCompletion(jobId, authToken, deadline) {
  while (Date.now() < deadline) {
    const status = await checkStatus(jobId, authToken);
    if (status.status === "DONE") return status.result.image_url;
    if (status.status === "FAILED") throw new Error(`PicsArt enhancement gagal: ${status.error_message || "unknown error"}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("PicsArt enhancement kelamaan (timeout), proses dibatalkan.");
}

/**
 * @param {Buffer|string} input - buffer gambar mentah, ATAU url gambar (string) yang sudah bisa
 *   diakses publik (misal hasil upload ke catbox.moe)
 * @param {{scale?: number}} [opts]
 * @returns {Promise<Buffer>} buffer gambar hasil upscale (PNG)
 */
async function picsartUpscale(input, { scale = 4 } = {}) {
  const deadline = Date.now() + ENHANCE_TIMEOUT_MS;
  const authToken = await getAuthToken();

  const imageUrl = Buffer.isBuffer(input) ? await uploadBuffer(input, authToken) : input;

  const enhanceRes = await enhanceImage(imageUrl, authToken, scale);
  if (!enhanceRes || !enhanceRes.id) {
    throw new Error("PicsArt tidak mengembalikan job ID -- kemungkinan gambar ditolak atau layanan sedang bermasalah.");
  }

  const resultUrl = await waitForCompletion(enhanceRes.id, authToken, deadline);
  const downloadRes = await axios.get(resultUrl, { responseType: "arraybuffer", timeout: 30000 });
  return Buffer.from(downloadRes.data);
}

module.exports = { picsartUpscale };
