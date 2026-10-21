const axios = require("axios");

// SENGAJA pakai subdomain regional "in.pinterest.com", BUKAN "www.pinterest.com" -- ini pola
// yang dipakai library scraper Pinterest yang masih aktif dipelihara (dicek per Agustus 2026,
// User-Agent-nya nunjuk Chrome versi 139 -- relatif baru), kemungkinan subdomain regional kena
// rate-limit/bot-detection yang lebih longgar dibanding domain utama "www" yang paling sering
// di-scrape orang.
const BASE_URL = "https://in.pinterest.com";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0";

// Header super lengkap ala browser asli (client hints Sec-Ch-Ua-*, fetch metadata Sec-Fetch-*,
// dst) -- Pinterest kemungkinan ngecek kombinasi header-header ini buat bedain browser asli VS
// script polos. Request sebelumnya cuma kirim ~5 header, jauh dari lengkap ini.
const BASE_HEADERS = {
  Host: "in.pinterest.com",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Ch-Ua": '"Chromium";v="139", "Not/A)Brand";v="24"',
  "Sec-Ch-Ua-Model": '""',
  "Sec-Ch-Ua-Mobile": "?0",
  "X-Requested-With": "XMLHttpRequest",
  Accept: "application/json, text/javascript, */*, q=0.01",
  "X-Pinterest-Source-Url": "",
  "X-Pinterest-Appstate": "active",
  "Accept-Language": "en-US,en;q=0.9",
  "Screen-Dpr": "1",
  "X-Pinterest-Pws-Handler": "www/search/[scope].js",
  "User-Agent": UA,
  "Sec-Ch-Ua-Platform-Version": '""',
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  Referer: `${BASE_URL}/`,
  Priority: "u=1, i",
};

/** Gabungin semua Set-Cookie dari response jadi satu string Cookie buat request berikutnya */
function extractCookieHeader(setCookieArray) {
  if (!setCookieArray || !setCookieArray.length) return "";
  return setCookieArray.map((c) => c.split(";")[0]).join("; ");
}

/**
 * Cari pin PINTEREST ASLI lewat endpoint JSON internal Pinterest -- publik, gak butuh login/API
 * key buat pencarian anonim, tapi (beda dari versi sebelumnya) BUTUH 2 request berurutan:
 *
 * 1. "Warm-up" -- GET biasa ke halaman pencarian (`/search/pins/?q=...`) buat dapetin cookies
 *    session dari Pinterest (Set-Cookie di response-nya). TANPA cookies ini, request API di
 *    langkah 2 keliatan kayak request "dingin"/gak ada history browsing sama sekali, dan lebih
 *    gampang ke-flag sebagai bot -> 403.
 * 2. Request API beneran (`/resource/BaseSearchResource/get/`), pakai cookies dari langkah 1 +
 *    header lengkap ala browser asli (lihat BASE_HEADERS).
 *
 * Pola 2-langkah ini di-reverse-engineer dari library scraper Pinterest publik yang masih aktif
 * dipelihara (github.com/iamatulsingh/pinscrape, dicek Agustus 2026).
 *
 * SENGAJA GAK ADA FALLBACK KE OPENVERSE DI SINI -- command .pinterest dan .openverse punya
 * fungsi masing-masing: .pinterest MURNI Pinterest, .openverse MURNI Openverse. Kalau gagal, ya
 * emang digagalin terus terang (command-nya yang nyaranin coba .openverse sebagai alternatif
 * eksplisit, bukan otomatis nukar sumber diam-diam).
 *
 * CATATAN: endpoint ini gak resmi didokumentasikan Pinterest, jadi strukturnya bisa berubah
 * sewaktu-waktu tanpa pemberitahuan. Kalau suatu saat mulai gagal terus walau warm-up+cookies
 * udah bener, kemungkinan besar cuma butuh nyesuain header/parsing di bawah lagi.
 */
async function searchPinterest(query, limit = 10) {
  const sourceUrl = `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`;

  // ==== LANGKAH 1: warm-up, dapetin cookies ====
  const warmupRes = await axios.get(`${BASE_URL}${sourceUrl}`, {
    headers: BASE_HEADERS,
    timeout: 20000,
    validateStatus: () => true,
  });
  const cookieHeader = extractCookieHeader(warmupRes.headers["set-cookie"]);

  // ==== LANGKAH 2: request API beneran, pakai cookies dari langkah 1 ====
  const payload = {
    options: {
      query,
      scope: "pins",
      rs: "typed",
      page_size: String(Math.min(limit, 26)),
      source_url: sourceUrl,
      redux_normalize_feed: true,
    },
    context: {},
  };

  const res = await axios.get(`${BASE_URL}/resource/BaseSearchResource/get/`, {
    params: {
      source_url: sourceUrl,
      data: JSON.stringify(payload),
      _: Date.now(),
    },
    timeout: 20000,
    headers: {
      ...BASE_HEADERS,
      "X-Pinterest-Source-Url": sourceUrl,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    // axios biasanya auto-throw kalau status bukan 2xx -- di-override biar response TETAP masuk
    // sini apapun status-nya, ditangani manual di bawah biar pesan errornya jelas nunjuk
    // penyebab spesifiknya (bukan cuma "Request failed with status code 403" yang gak informatif).
    validateStatus: () => true,
  });

  // Pinterest kadang balikin HALAMAN HTML (bukan JSON) kalau lagi ngedeteksi request ini
  // sebagai bot/nge-block sementara (challenge page, dsb) -- axios gak bakal auto-parse itu
  // jadi object, res.data-nya bakal berupa STRING mentah. Dibedain eksplisit di sini biar
  // pesan errornya jelas nunjuk "diblokir Pinterest", bukan disamain sama "emang gak ada hasil".
  if (typeof res.data === "string") {
    throw new Error(
      `Pinterest balikin HTML (bukan JSON) -- kemungkinan lagi ngeblokir/rate-limit request ini ` +
      `(HTTP ${res.status}) meskipun udah pakai cookies dari warm-up request. Coba lagi beberapa ` +
      `saat lagi. Kalau terus-terusan kejadian, kemungkinan header/fingerprint yang dipakai di ` +
      `lib/pinterestSearch.js perlu disesuaikan lagi (Pinterest sering update deteksi bot-nya).`
    );
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Pinterest balikin HTTP ${res.status} (bukan sukses). Detail: ${JSON.stringify(res.data).slice(0, 200)}`);
  }

  const results = res.data?.resource_response?.data?.results || [];
  const urls = results
    .map((pin) => pin?.images?.orig?.url || pin?.images?.["736x"]?.url || pin?.images?.["474x"]?.url)
    .filter(Boolean);

  if (urls.length === 0) {
    throw new Error(
      `Endpoint Pinterest ngebales normal (HTTP ${res.status}) tapi gak ada hasil gambar buat "${query}" -- ` +
      `bisa jadi struktur respons JSON-nya udah berubah (results kosong/field images pindah), atau ` +
      `emang gak ada hasil pencarian buat kata kunci ini.`
    );
  }
  return urls.slice(0, limit);
}

module.exports = { searchPinterest };
