const { createWorker } = require("tesseract.js");
const { isLowSpec } = require("./systemSpecs");

/**
 * Worker Tesseract di-reuse antar pemanggilan (bukan bikin worker baru + `terminate()`
 * tiap kali dipanggil kayak sebelumnya). Yang paling berat/lambat dari OCR ini justru
 * proses INIT worker-nya (load engine + data bahasa ind+eng), bukan proses recognize-nya
 * sendiri -- jadi kalau bikin ulang tiap request, tiap panggilan `.ocr` kebuang-buang
 * waktu/CPU buat load ulang hal yang sama.
 *
 * Worker otomatis dimatikan sendiri kalau nganggur cukup lama, biar gak nahan RAM
 * terus-terusan pas fitur ini gak lagi dipakai.
 *
 * OPTIMIZATION:
 * - Queue management: Jangan langsung recognize kalau worker sedang sibuk
 * - Concurrent limit: Max 3 concurrent jobs (untuk CPU multi-core)
 * - Error recovery: Kalau worker error, buat fresh worker baru
 */
const getIdleTimeoutMs = () => (isLowSpec() ? 60 * 1000 : 5 * 60 * 1000); // di low-spec (2GB RAM), matikan worker setelah 1 menit idle
const getMaxConcurrentJobs = () => (isLowSpec() ? 1 : 3); // di Celeron dual-core, 1 job saja

let workerPromise = null;
let idleTimer = null;
let jobQueue = []; // Queue request kalau worker lagi sibuk
let activeJobs = 0;

function scheduleIdleShutdown() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    const pending = workerPromise;
    workerPromise = null;
    idleTimer = null;
    try {
      const worker = await pending;
      await worker.terminate();
      console.log("✅ OCR worker terminated (idle timeout)");
      if (isLowSpec() && global.gc) {
        try { global.gc(); } catch {}
      }
    } catch (err) {
      console.error("⚠️  Error terminating OCR worker:", err.message);
    }
  }, getIdleTimeoutMs());
  idleTimer.unref?.(); // timer housekeeping doang, jangan sampai nahan proses Node biar gak exit
}

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("ind+eng").catch((err) => {
      console.error("❌ OCR worker init failed:", err.message);
      workerPromise = null; // Reset kalau error, biar bisa retry
      throw err;
    });
  }
  return workerPromise;
}

/**
 * Process job dari queue kalau ada slot yang kosong
 */
async function processQueue() {
  if (activeJobs >= getMaxConcurrentJobs() || jobQueue.length === 0) return;

  const { inputBuffer, resolve, reject } = jobQueue.shift();
  activeJobs++;

  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(inputBuffer);
    resolve(data.text.trim());
  } catch (err) {
    reject(new Error(`OCR failed: ${err.message}`));
  } finally {
    activeJobs--;
    processQueue(); // Process job berikutnya kalau ada
  }
}

/**
 * Baca teks dari gambar secara LOKAL pakai tesseract.js (OCR engine open-source).
 * Support Bahasa Indonesia + Inggris sekaligus.
 * Catatan: run PERTAMA KALI butuh internet sebentar buat download data bahasanya
 * (resmi dari project tesseract.js, bukan API misterius) — setelah itu ke-cache.
 *
 * OPTIMIZATION:
 * - Worker di-reuse (bukan create ulang)
 * - Request di-queue (max 3 concurrent jobs)
 * - Auto-shutdown setelah 5 menit idle
 * - Error recovery jika worker fail
 */
async function recognizeText(inputBuffer) {
  if (idleTimer) clearTimeout(idleTimer); // Lagi dipakai, batalin shutdown

  return new Promise((resolve, reject) => {
    let timeoutId = null;

    const wrappedResolve = (result) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(result);
    };

    const wrappedReject = (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(err);
    };

    // Timeout safeguard: kalau queue terlalu lama, batalkan
    timeoutId = setTimeout(() => {
      const idx = jobQueue.findIndex((j) => j.inputBuffer === inputBuffer);
      if (idx !== -1) {
        jobQueue.splice(idx, 1);
        wrappedReject(new Error("OCR request timeout (queue too long)"));
      }
    }, 2 * 60 * 1000); // 2 menit timeout

    jobQueue.push({ inputBuffer, resolve: wrappedResolve, reject: wrappedReject });
    processQueue();
  }).finally(() => {
    scheduleIdleShutdown();
  });
}

module.exports = { recognizeText };
