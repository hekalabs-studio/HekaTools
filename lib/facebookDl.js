const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Download video/foto Facebook via getvidfb.com -- dipakai sebagai FALLBACK kalau yt-dlp gagal
 * (yt-dlp cuma bisa Facebook VIDEO, sama sekali gak bisa extract FOTO dari post FB -- makanya
 * buat foto, ini satu-satunya jalan, bukan sekadar fallback).
 *
 * Sengaja pakai axios+cheerio biasa (HTTP request + parse HTML statis), BUKAN
 * puppeteer/browser-automation -- biar tetap ringan & jalan normal di semua platform termasuk
 * Termux/HP (puppeteer butuh download Chromium ~300MB, seringkali gak jalan mulus di proot
 * Android). Pola scraping ini di-reverse-engineer dari implementasi publik yang udah
 * dikonfirmasi jalan (lihat github.com/siputzx/apisku/blob/master/router/downloader/facebook.ts).
 */
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36";
const REQUEST_TIMEOUT_MS = 30000;

/**
 * @returns {Promise<{title: string, thumbnail: string, videos: {url:string, resolution:string}[], photos: string[]}>}
 */
async function facebookLookup(fbUrl) {
  const res = await axios.post(
    "https://getvidfb.com/",
    `url=${encodeURIComponent(fbUrl)}&lang=en&type=redirect`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://getvidfb.com",
        Referer: "https://getvidfb.com/",
        "User-Agent": UA,
      },
      timeout: REQUEST_TIMEOUT_MS,
    }
  );

  const $ = cheerio.load(res.data);
  const container = $("#snaptik-video");
  if (!container.length) {
    throw new Error("Link Facebook ini gak ketemu hasilnya (kemungkinan post private/dihapus/link invalid).");
  }

  const title = container.find(".snaptik-middle h3").text().trim() || "Facebook";
  const thumbnail = container.find(".snaptik-left img").attr("src") || "";

  const videos = [];
  const photos = [];
  container.find(".abuttons a").each((_, el) => {
    const link = $(el).attr("href");
    const label = $(el).find(".span-icon span").last().text().trim();
    if (!link || !link.startsWith("http")) return;
    if (/photo|jpg/i.test(label)) photos.push(link);
    else if (!/mp3|audio/i.test(label)) videos.push({ url: link, resolution: /hd/i.test(label) ? "HD" : "SD" });
  });

  if (!videos.length && !photos.length) {
    throw new Error("Gak ketemu link download apapun (video/foto) dari post ini.");
  }
  return { title, thumbnail, videos, photos };
}

/** @returns {Promise<{buffer: Buffer, title: string}>} -- ambil video kualitas terbaik yang ada */
async function downloadFacebookVideo(fbUrl) {
  const { title, videos } = await facebookLookup(fbUrl);
  if (!videos.length) throw new Error("Post ini gak ada videonya (mungkin post foto -- coba .fbphoto).");
  const best = videos.find((v) => v.resolution === "HD") || videos[0];
  const res = await axios.get(best.url, { responseType: "arraybuffer", timeout: 60000, headers: { "User-Agent": UA } });
  return { buffer: Buffer.from(res.data), title };
}

/** @returns {Promise<{buffers: Buffer[], title: string}>} -- semua foto di post (kalau lebih dari 1) */
async function downloadFacebookPhotos(fbUrl) {
  const { title, photos } = await facebookLookup(fbUrl);
  if (!photos.length) throw new Error("Post ini gak ada fotonya (mungkin post video -- coba .fbdl).");
  const buffers = await Promise.all(
    photos.map((url) => axios.get(url, { responseType: "arraybuffer", timeout: 60000, headers: { "User-Agent": UA } }).then((r) => Buffer.from(r.data)))
  );
  return { buffers, title };
}

module.exports = { downloadFacebookVideo, downloadFacebookPhotos };
