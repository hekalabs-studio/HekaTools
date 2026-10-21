const httpClient = require("./httpClient"); // OPTIMIZATION: Use pooled HTTP client
const crypto = require("crypto");
const downloaderCache = require("./downloaderCache");
const { retryWithBackoff } = require("./retryHelper");

/**
 * Download foto/video dari LINK pin Pinterest (bukan search by keyword -- itu lib/pinterestSearch.js).
 *
 * Dipakai sebagai pengganti/pelengkap yt-dlp buat command `.pinterestdl`, karena extractor
 * Pinterest di yt-dlp gak selalu jalan (dan yt-dlp emang gak pernah bisa handle FOTO Pinterest
 * sama sekali -- cuma video, sama kayak masalah yt-dlp di Facebook).
 *
 * BEDA DARI lib/pinterestSearch.js: file itu manggil API pencarian internal Pinterest
 * (BaseSearchResource) yang butuh warm-up request + cookies dan MASIH bisa diblokir (403) kalau
 * anti-bot Pinterest lagi ketat. File INI scraping halaman PIN PUBLIK langsung (bukan API
 * pencarian) -- pola ini dikonfirmasi beberapa scraper Pinterest open-source (termasuk yang
 * dipakai Apify buat scrape profil publik) sebagai "HTTP-only, no login, no cookies" -- karena
 * halaman pin individual dirender server-side dengan semua datanya (foto/video/dst) di-embed
 * langsung ke HTML lewat blob JSON `__PWS_DATA__`, gak perlu manggil API terpisah sama sekali.
 *
 * Alur:
 * 1. Ikutin redirect kalau link-nya `pin.it` (short link) ke URL pin penuh.
 * 2. Fetch HTML halaman pin-nya.
 * 3. LAPIS 1: cari SEMUA blob JSON `<script type="application/json">` di halaman (bukan cuma
 *    yang id="__PWS_DATA__", karena nama id itu bisa berubah kapan aja) -- parse satu-satu,
 *    cari video_list/images di dalamnya.
 * 4. LAPIS 2: kalau semua blob JSON gagal, coba meta tag `og:image` (cuma nolongin FOTO).
 * 5. LAPIS 3: kalau itu juga gagal, regex mentah cari URL CDN Pinterest (`i.pinimg.com` buat
 *    foto, `v1.pinimg.com` buat video) di MANAPUN di teks HTML, gak peduli itu di dalam JSON
 *    valid atau enggak -- jaring pengaman paling dasar tapi paling tahan banting kalau struktur
 *    halaman Pinterest berubah drastis.
 * 6. Kalau SEMUA lapis gagal, error yang dikasih balik nyertain diagnostik (judul halaman yang
 *    sebenernya didapet, panjang HTML) biar ketauan apakah ini kasus diblokir/dialihkan ke
 *    halaman lain (misal warning "sensitive content" atau cookie consent), bukan cuma "gagal".
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

// Header lumayan lengkap ala browser asli -- sama kayak yang dipakai lib/pinterestSearch.js,
// soalnya Pinterest kemungkinan ngecek fingerprint header ini di SEMUA endpoint mereka
// (termasuk halaman pin biasa), bukan cuma di API pencarian.
const REQUEST_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": '"Chromium";v="139", "Not/A)Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/** Cari nilai pertama yang match salah satu dari beberapa kemungkinan path di object JSON (rekursif, dangkal) */
function deepFind(obj, keyNames, depth = 0) {
  if (depth > 12 || obj === null || typeof obj !== "object") return null;
  for (const key of keyNames) {
    if (obj[key]) return obj[key];
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      const found = deepFind(val, keyNames, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/**
 * @param {string} url - link pin Pinterest (pinterest.com/pin/... ATAU pin.it/... short link)
 * @returns {Promise<{type: "video"|"image", url: string, title: string}>}
 */
async function pinterestLookup(url) {
  const res = await httpClient.get(url, {
    headers: REQUEST_HEADERS,
    timeout: 20000,
    maxRedirects: 5, // penting -- link pin.it (short link) selalu redirect ke URL pin penuh
    validateStatus: () => true, // biar response tetap ditangani manual di bawah, bukan langsung throw
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Halaman pin balikin HTTP ${res.status} (kemungkinan diblokir/link invalid).`);
  }
  const html = String(res.data);

  // ==== Lapis 1: cari SEMUA blob JSON <script type="application/json"> di halaman (bukan cuma
  // yang id="__PWS_DATA__" doang -- nama id-nya bisa berubah kapan aja tanpa pemberitahuan,
  // jadi lebih aman nyoba parse SEMUA script JSON yang ada, siapa tau datanya nyempil di salah
  // satu yang beda nama). Untuk tiap blob yang berhasil di-parse, dicari video_list/images-nya.
  const scriptMatches = [...html.matchAll(/<script[^>]*type="application\/json"[^>]*>(.+?)<\/script>/gs)];
  for (const match of scriptMatches) {
    try {
      const data = JSON.parse(match[1]);
      const videoList = deepFind(data, ["video_list"]);
      if (videoList && typeof videoList === "object") {
        const firstVideo = Object.values(videoList).find((v) => v?.url);
        if (firstVideo?.url) {
          const title = deepFind(data, ["title", "grid_title"]) || "Pinterest video";
          return { type: "video", url: firstVideo.url, title: String(title) };
        }
      }
      const images = deepFind(data, ["images"]);
      const imageUrl = images?.orig?.url || images?.["736x"]?.url || images?.["474x"]?.url;
      if (imageUrl) {
        const title = deepFind(data, ["title", "grid_title"]) || "Pinterest image";
        return { type: "image", url: imageUrl, title: String(title) };
      }
    } catch {
      // blob ini bukan JSON valid / gak ada data yang dicari -- lanjut ke blob <script> berikutnya
    }
  }

  // ==== Lapis 2: meta tag og:image (cuma nolongin kasus FOTO, tapi gak perlu JSON valid sama sekali) ====
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogImageMatch) {
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
    return { type: "image", url: ogImageMatch[1], title: titleMatch?.[1] || "Pinterest image" };
  }

  // ==== Lapis 3: regex mentah cari URL CDN Pinterest LANGSUNG di teks HTML, TANPA peduli JSON
  // valid/gak valid atau ada di dalam tag <script> yang mana. Ini jaring pengaman PALING dasar --
  // gambar Pinterest SELALU di-hosting di domain "i.pinimg.com" dan video di "v1.pinimg.com"/
  // domain video-*.pinimg.com, jadi kalau URL kayak gitu muncul DI MANAPUN di HTML (bukan cuma di
  // blob JSON tertentu), kemungkinan besar itu memang media dari pin ini.
  const videoUrlMatch = html.match(/https:\\?\/\\?\/v1\.pinimg\.com[^"'\s]+?\.mp4/i);
  if (videoUrlMatch) {
    return { type: "video", url: videoUrlMatch[0].replace(/\\\//g, "/"), title: "Pinterest video" };
  }
  const imageUrlMatch = html.match(/https:\\?\/\\?\/i\.pinimg\.com[^"'\s]+?\.(jpg|jpeg|png|gif|webp)/i);
  if (imageUrlMatch) {
    return { type: "image", url: imageUrlMatch[0].replace(/\\\//g, "/"), title: "Pinterest image" };
  }

  // Semua lapis gagal -- kasih info diagnostik (bukan cuma "gagal", tapi APA yang sebenernya
  // dibalikin server, biar ketauan ini kasus diblokir/dialihkan ke halaman lain/dst)
  const pageTitleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  throw new Error(
    `Gak ketemu foto/video di halaman ini (HTTP ${res.status}, panjang HTML ${html.length} karakter, ` +
    `judul halaman: "${pageTitleMatch?.[1]?.trim() || "(gak ketemu tag <title>)"}"). ` +
    `Kemungkinan link-nya invalid/pin udah dihapus, dialihkan ke halaman lain (misal konfirmasi ` +
    `"sensitive content" atau consent cookie), atau struktur halaman Pinterest berubah total.`
  );
}

/** @returns {Promise<{buffer: Buffer, title: string, type: "video"|"image"}>} */
async function downloadFromPinterestLink(url) {
  // OPTIMIZATION: Check cache
  const urlHash = crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
  const cached = downloaderCache.get("pinterest", urlHash);
  if (cached) {
    return cached;
  }

  // OPTIMIZATION: Retry 3x
  const result = await retryWithBackoff(
    async () => {
      const lookupResult = await pinterestLookup(url);
      const mediaRes = await httpClient.get(lookupResult.url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": UA },
      });
      return { buffer: Buffer.from(mediaRes.data), title: lookupResult.title, type: lookupResult.type };
    },
    3,
    1000
  );

  // OPTIMIZATION: Cache
  downloaderCache.set("pinterest", urlHash, result);
  return result;
}

module.exports = { downloadFromPinterestLink };
