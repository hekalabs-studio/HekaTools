const axios = require("axios");
const FormData = require("form-data");

/**
 * Colorize (kasih warna) ke gambar hitam-putih/grayscale via kolorize.cc -- layanan online
 * gratis, gak perlu API key/login.
 *
 * Di-port dari implementasi nyata (github.com/siputzx/apisku/blob/master/router/tools/colorize.ts).
 * Alurnya 4 langkah berurutan, SEMUANYA WAJIB pakai cookies session yang sama (di-track manual
 * di sini via `cookieHeader`, mirip pola warm-up di lib/pinterestSearch.js):
 *
 * 1. Upload gambar ke /api/upload -> dapet sourceKey + dimensi gambar (w/h/dpi)
 * 2. Minta "ticket" processing ke /ticket (POST) -> dapet ticket ID
 * 3. Poll /ticket?ticket=xxx (GET, response-nya STREAM progresif) sampai beres -> ambil chunk
 *    TERAKHIR yang dikirim (chunk-chunk sebelumnya cuma update progress, bukan hasil final)
 * 4. Lookup hasil akhirnya di /api/lookup pakai outputKey dari langkah 3 -> dapet gambar hasil
 *    dalam bentuk data URI base64 (`data:image/webp;base64,...`)
 */
const BASE_URL = "https://kolorize.cc";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT_MS = 30000;
const POLL_TIMEOUT_MS = 60000; // proses colorize di server mereka bisa makan waktu, timeout digenerus-in dikit

// SEBELUMNYA: kalau stream polling di langkah 3 berhenti (event 'end') SEBELUM proses colorize
// di server mereka beneran kelar, chunk terakhir yang ke-capture cuma status "masih di awal
// proses" (contoh nyata: `{"progress":0}`) -- dan itu langsung dianggap KEGAGALAN PERMANEN,
// padahal ini kondisi TRANSIENT yang cukup sering: proxy/CDN di depan server mereka suka motong
// koneksi streaming lebih awal dari yang seharusnya (bukan proses colorize-nya yang gagal, cuma
// koneksi HTTP-nya yang keburu putus). Ticket ID-nya masih valid & proses di server mereka
// kemungkinan besar tetap jalan di background -- jadi solusinya: POLL ULANG ticket yang sama
// beberapa kali (bukan bikin ticket baru) sebelum benar-benar nyerah.
const POLL_RETRY_ATTEMPTS = 3; // total percobaan poll (1 awal + 2 retry)
const POLL_RETRY_DELAY_MS = 2500; // jeda antar retry, kasih waktu proses di server mereka lanjut jalan

const BASE_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "id-ID,id;q=0.9",
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
  "User-Agent": UA,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cookie jar super sederhana -- simpen Set-Cookie dari tiap response, gabung buat request berikutnya */
function extractCookieHeader(setCookieArray, existingCookieHeader = "") {
  if (!setCookieArray || !setCookieArray.length) return existingCookieHeader;
  const newCookies = setCookieArray.map((c) => c.split(";")[0]);
  const existing = existingCookieHeader ? existingCookieHeader.split("; ") : [];
  const merged = { ...Object.fromEntries(existing.map((c) => c.split("="))), ...Object.fromEntries(newCookies.map((c) => c.split("="))) };
  return Object.entries(merged).map(([k, v]) => `${k}=${v}`).join("; ");
}

/**
 * Satu kali poll ke /ticket (GET, response-nya STREAM progresif) sampai koneksinya berakhir
 * (baik karena proses beneran udah kelar, ATAU karena koneksinya keburu diputus server/proxy
 * sebelum kelar -- pemanggil yang mutusin mana yang terjadi lewat isi `taskResult` yang
 * dikembalikan, lihat retry loop di colorizeImage()).
 * @returns {Promise<object>} taskResult (hasil parse JSON dari chunk stream TERAKHIR)
 */
async function pollTicketOnce(ticket, cookieHeader) {
  const finalChunk = await new Promise((resolve, reject) => {
    axios
      .get(`${BASE_URL}/ticket`, {
        params: { ticket },
        headers: { ...BASE_HEADERS, Cookie: cookieHeader },
        responseType: "stream",
        timeout: POLL_TIMEOUT_MS,
      })
      .then((streamRes) => {
        const chunks = [];
        streamRes.data.on("data", (chunk) => chunks.push(chunk.toString()));
        streamRes.data.on("end", () => resolve(chunks[chunks.length - 1]));
        streamRes.data.on("error", reject);
      })
      .catch(reject);
  });

  try {
    return JSON.parse(finalChunk);
  } catch {
    throw new Error("Gagal baca hasil akhir proses colorize (response terakhir dari server bukan JSON valid).");
  }
}

/** @returns {Promise<Buffer>} */
async function colorizeImage(imageBuffer, fileName = "image.jpg") {
  let cookieHeader = "";

  // ==== Langkah 1: upload ====
  const form = new FormData();
  form.append("files", imageBuffer, { filename: fileName, contentType: "image/jpeg" });
  const uploadRes = await axios.post(`${BASE_URL}/api/upload`, form, {
    headers: { ...BASE_HEADERS, ...form.getHeaders(), Cookie: cookieHeader },
    timeout: REQUEST_TIMEOUT_MS,
  });
  cookieHeader = extractCookieHeader(uploadRes.headers["set-cookie"], cookieHeader);

  const uploadResult = uploadRes.data?.results?.[0];
  if (!uploadResult?.sourceKey) {
    throw new Error("Upload gagal -- server gak balikin sourceKey (kemungkinan format gambar gak didukung atau layanan lagi bermasalah).");
  }

  // ==== Langkah 2: minta ticket processing ====
  const ticketRes = await axios.post(
    `${BASE_URL}/ticket`,
    {
      type: "colorize_v2",
      fnKey: uploadResult.sourceKey,
      w: uploadResult.w,
      h: uploadResult.h,
      prompt: "colorize image",
      tries: 0,
      seq: 0,
      dpi: uploadResult.dpi,
    },
    { headers: { ...BASE_HEADERS, "Content-Type": "application/json", Cookie: cookieHeader }, timeout: REQUEST_TIMEOUT_MS }
  );
  cookieHeader = extractCookieHeader(ticketRes.headers["set-cookie"], cookieHeader);

  const ticket = ticketRes.data?.ticket;
  if (!ticket) throw new Error("Gagal dapet ticket processing dari server.");

  // ==== Langkah 3: poll stream sampai proses selesai, ambil chunk TERAKHIR ====
  // Di-retry (bukan cuma sekali) -- lihat catatan panjang di POLL_RETRY_ATTEMPTS di atas soal
  // kenapa stream yang berhenti prematur (belum ada outputKey) itu kondisi transient, BUKAN
  // kegagalan permanen. Ticket ID yang SAMA dipakai ulang di tiap percobaan (bukan minta ticket
  // baru), karena proses di server mereka kemungkinan besar tetap lanjut jalan di background
  // walau koneksi HTTP kita ke mereka sempat putus.
  let taskResult;
  let lastRawError;
  for (let attempt = 1; attempt <= POLL_RETRY_ATTEMPTS; attempt++) {
    taskResult = await pollTicketOnce(ticket, cookieHeader);
    if (taskResult?.outputKey) break; // beres, lanjut ke langkah 4

    lastRawError = taskResult?.error;
    if (attempt < POLL_RETRY_ATTEMPTS) {
      await sleep(POLL_RETRY_DELAY_MS);
    }
  }

  if (!taskResult?.outputKey) {
    // Bikin pesan error yang lebih jelas dibanding cuma dump JSON mentah -- kalau errornya
    // ternyata cuma status "progress" (bukti kuat koneksi keburu putus, bukan proses yang
    // beneran gagal), tegasin itu ke user biar gak salah kira ini masalah di gambarnya.
    const looksLikeStillProcessing = typeof lastRawError === "string" && /"progress"/i.test(lastRawError);
    throw new Error(
      looksLikeStillProcessing
        ? `Server colorize keburu putus koneksi sebelum proses gambarnya kelar (udah dicoba ulang ${POLL_RETRY_ATTEMPTS}x, ` +
          `tetap belum kelar juga). Ini biasanya kejadian kalau servernya lagi sibuk/lambat, bukan gambarnya yang bermasalah. ` +
          `Coba lagi beberapa saat lagi.`
        : `Proses colorize gagal di server: ${lastRawError || "alasan gak diketahui"}`
    );
  }

  // ==== Langkah 4: lookup hasil akhirnya ====
  const lookupRes = await axios.post(
    `${BASE_URL}/api/lookup`,
    { keyOrUrl: taskResult.outputKey, mode: 3, r: 1.5, forceH: 0 },
    { headers: { ...BASE_HEADERS, "Content-Type": "application/json", Cookie: cookieHeader }, timeout: REQUEST_TIMEOUT_MS }
  );

  const imgDataUri = lookupRes.data?.imgUrl;
  if (!imgDataUri) throw new Error("Server gak balikin gambar hasilnya (lookup gagal).");

  return Buffer.from(imgDataUri.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

module.exports = { colorizeImage };
