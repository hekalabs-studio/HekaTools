const httpClient = require("./httpClient"); // OPTIMIZATION: Use pooled HTTP client
const crypto = require("crypto");
const downloaderCache = require("./downloaderCache");
const { retryWithBackoff } = require("./retryHelper");

/**
 * Fallback ONLINE khusus TikTok via TikWM (tikwm.com) -- API publik GRATIS, gak perlu API key,
 * dipakai banyak project open-source TikTok downloader selama bertahun-tahun (jauh lebih
 * established/stabil dibanding aggregator random yang sebelumnya sempat dicoba buat fitur
 * waifu2x -- itu sebabnya kali ini gak asal nebak banyak endpoint, formatnya udah dikonfirmasi
 * dari source code beberapa library open-source yang makein API ini).
 *
 * KENAPA INI DIBUTUHKAN: TikTok sering banget ubah struktur halaman webnya, dan tiap kali itu
 * kejadian, extractor TikTok di yt-dlp jadi error (`Unexpected response from webpage request`,
 * dst -- lihat github.com/yt-dlp/yt-dlp/issues/17403) sampai developer yt-dlp sempat patch,
 * yang bisa makan waktu beberapa hari/minggu. TikWM maintain scraper-nya sendiri secara
 * terpisah, jadi kadang tetap jalan normal pas yt-dlp lagi kena masalah kayak gitu (dan
 * sebaliknya -- makanya ini dipakai sebagai FALLBACK, bukan pengganti yt-dlp sepenuhnya,
 * yt-dlp tetap dicoba duluan karena lebih general-purpose & biasanya lebih cepat).
 */
const TIKWM_TIMEOUT_MS = 30000;
const DOWNLOAD_TIMEOUT_MS = 60000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Buat URL hash buat cache key
 * @param {string} url
 * @returns {string} 8-char hash
 */
function makeUrlHash(url) {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
}

async function tikwmLookup(url) {
  // OPTIMIZATION: Check cache dulu
  const urlHash = makeUrlHash(url);
  const cached = downloaderCache.get("tiktok", urlHash);
  if (cached) {
    return cached;
  }

  // OPTIMIZATION: Retry 3x dengan exponential backoff
  const data = await retryWithBackoff(
    async () => {
      const res = await httpClient.get("https://www.tikwm.com/api/", {
        params: { url, hd: 1 },
        timeout: TIKWM_TIMEOUT_MS,
        headers: { "User-Agent": UA },
      });
      if (res.data?.code !== 0 || !res.data?.data) {
        throw new Error(`TikWM gagal: ${res.data?.msg || "response gak dikenali/kosong"}`);
      }
      return res.data.data;
    },
    3,    // max retries
    1000  // initial delay (ms)
  );

  // OPTIMIZATION: Cache hasil
  downloaderCache.set("tiktok", urlHash, data);
  return data;
}

/** @returns {Promise<{buffer: Buffer, title: string}>} */
async function downloadVideoViaTikwm(url) {
  const data = await tikwmLookup(url);
  // hdplay (HD, tanpa watermark) diprioritaskan, fallback ke play (SD, tanpa watermark) --
  // BUKAN wmplay, itu masih ada watermark TikTok-nya.
  const videoUrl = data.hdplay || data.play;
  if (!videoUrl) throw new Error("TikWM gak ngembaliin link video sama sekali (kemungkinan video private/dihapus).");
  const videoRes = await httpClient.get(videoUrl, { responseType: "arraybuffer", timeout: DOWNLOAD_TIMEOUT_MS, headers: { "User-Agent": UA } });
  return { buffer: Buffer.from(videoRes.data), title: data.title || "tiktok video" };
}

/** @returns {Promise<{buffer: Buffer, title: string}>} */
async function downloadAudioViaTikwm(url) {
  const data = await tikwmLookup(url);
  if (!data.music) throw new Error("TikWM gak ngembaliin link audio sama sekali.");
  const audioRes = await httpClient.get(data.music, { responseType: "arraybuffer", timeout: DOWNLOAD_TIMEOUT_MS, headers: { "User-Agent": UA } });
  return { buffer: Buffer.from(audioRes.data), title: data.title || "tiktok audio" };
}

/** @returns {Promise<{buffers: Buffer[], title: string}>} -- buat slideshow/photo-mode TikTok */
async function downloadImagesViaTikwm(url) {
  const data = await tikwmLookup(url);
  // Field array foto buat post slideshow TikTok -- namanya bisa beda-beda tergantung versi
  // API TikWM (kadang "images", kadang "image_post_info" dst), makanya dicoba beberapa
  // kemungkinan nama field, bukan cuma satu, biar gak gampang meleset kalau mereka ubah nama.
  const images = data.images || data.image_post_info?.images?.map((i) => i.display_image?.url_list?.[0]) || [];
  const validImages = images.filter(Boolean);
  if (!validImages.length) {
    throw new Error("TikWM gak ngembaliin foto slideshow sama sekali (post ini mungkin video biasa, bukan slideshow -- coba .ttmp4).");
  }
  const buffers = await Promise.all(
    validImages.map((u) => httpClient.get(u, { responseType: "arraybuffer", timeout: DOWNLOAD_TIMEOUT_MS, headers: { "User-Agent": UA } }).then((r) => Buffer.from(r.data)))
  );
  return { buffers, title: data.title || "tiktok slideshow" };
}

module.exports = { downloadVideoViaTikwm, downloadAudioViaTikwm, downloadImagesViaTikwm };
