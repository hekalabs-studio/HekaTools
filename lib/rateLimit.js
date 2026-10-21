/**
 * Rate limiter per-user buat command RINGAN.
 *
 * Command BERAT udah punya antrean + limit sendiri di handler.js (MAX_HEAVY_PENDING per sender),
 * tapi command RINGAN (ping, menu, ai, brat, dll) sebelumnya gak dibatasi sama sekali -- user bisa
 * spam puluhan command per detik tanpa hambatan. Ini bikin:
 *  - API AI (Gemini, DeepSeek, dll) cepet kena rate limit karena 1 orang doang
 *  - Chat grup keisi spam balasan bot
 *  - Log membengkak gak karuan
 *
 * Rate limiter ini pakai sliding-window counter yang SUPER RINGAN:
 *  - Gak pake database/file, murni in-memory Map
 *  - Cuma nyimpen timestamp command terakhir per user (bukan semua history)
 *  - Auto-cleanup user yang udah idle > 5 menit (gak numpuk memory)
 *  - Gak ngaruh ke performa command itu sendiri (pengecekan O(1))
 *
 * Default: max 8 command dalam 10 detik per user. Bisa diubah di config.js.
 */

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

// Tiap user disimpen: { timestamps: number[], lastActivity: number }
const userBuckets = new Map();

/**
 * Cek apakah user masih dalam batas rate limit.
 * @param {string} senderJid - JID pengirim
 * @param {number} maxCommands - Maksimal command dalam window (default 8)
 * @param {number} windowMs - Ukuran window dalam ms (default 10000 = 10 detik)
 * @returns {{ allowed: boolean, retryAfterMs: number }} - allowed=false kalau kena limit
 */
function checkRateLimit(senderJid, maxCommands = 8, windowMs = 10_000) {
  const now = Date.now();
  let bucket = userBuckets.get(senderJid);

  if (!bucket) {
    bucket = { timestamps: [], lastActivity: now };
    userBuckets.set(senderJid, bucket);
  }

  bucket.lastActivity = now;

  // Buang timestamp yang udah di luar window
  const cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

  if (bucket.timestamps.length >= maxCommands) {
    // Kena limit -- hitung berapa lama lagi user harus nunggu
    const oldestInWindow = bucket.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  // Masih dalam batas -- catat timestamp ini
  bucket.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Cleanup user yang udah idle lama -- dipanggil berkala biar Map gak numpuk selamanya.
 */
function cleanupIdleBuckets() {
  const now = Date.now();
  let cleaned = 0;
  for (const [jid, bucket] of userBuckets) {
    if (now - bucket.lastActivity > CLEANUP_INTERVAL_MS) {
      userBuckets.delete(jid);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 [rateLimit] Cleanup: removed ${cleaned} idle user buckets (size now: ${userBuckets.size})`);
  }
}

// Jalanin cleanup tiap 5 menit
const cleanupTimer = setInterval(cleanupIdleBuckets, CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.(); // Jangan bikin process tetep hidup cuma gara-gara ini

module.exports = { checkRateLimit };
