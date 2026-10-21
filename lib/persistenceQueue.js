const fs = require("fs").promises;
const path = require("path");

/**
 * Queue untuk async file writes dengan debouncing.
 *
 * Manfaat:
 * 1. Non-blocking — tidak freeze main thread
 * 2. Debounced — multiple updates → 1 file write
 * 3. Error handling — kalau gagal, log tapi jangan crash
 * 4. Atomic writes — rename pattern biar tidak corrupt
 * 5. Graceful shutdown — flush pending writes saat exit
 *
 * Usage:
 *   const persistQueue = require('./lib/persistenceQueue');
 *   persistQueue.queueWrite('./data/users.json', userData);
 */

class PersistenceQueue {
  constructor() {
    this.queue = new Map(); // path -> { data, timeoutId }
    this.DEBOUNCE_MS = 500; // Tunggu 500ms sebelum write (batch updates)
    this.stats = { writes: 0, debounced: 0, errors: 0 };
  }

  /**
   * Queue data buat ditulis ke file.
   * Kalau ada update dalam 500ms, merge + defer write.
   *
   * @param {string} filePath - Path ke file (absolute atau relative)
   * @param {object} data - Data yang mau di-persist (akan di-stringify)
   */
  async queueWrite(filePath, data) {
    // Kalau ada pending write untuk file ini, batalkan timer-nya
    // sehingga update baru ini nge-reset timer (defer write ke 500ms kemudian)
    if (this.queue.has(filePath)) {
      const oldEntry = this.queue.get(filePath);
      clearTimeout(oldEntry.timeoutId);
      this.stats.debounced++;
    }

    // Schedule write untuk 500ms ke depan
    const timeoutId = setTimeout(async () => {
      try {
        const dir = path.dirname(filePath);

        // Create directory kalau belum exist
        await fs.mkdir(dir, { recursive: true });

        // Atomic write: tulis ke temp file, lalu rename
        // Ini jamin kalau ada crash tengah-tengah, file original gak corrupt
        const tempPath = filePath + ".tmp";
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
        await fs.rename(tempPath, filePath);

        this.stats.writes++;
        console.log(`📝 [persist] Saved: ${path.basename(filePath)} (${this.queue.size - 1} pending)`);
      } catch (err) {
        this.stats.errors++;
        console.error(`⚠️  [persist] Error saving ${path.basename(filePath)}:`, err.message);
        // Jangan throw/crash — data tetap ada di memory selama bot running
      } finally {
        // Hapus dari queue setelah selesai (atau setelah error)
        this.queue.delete(filePath);
      }
    }, this.DEBOUNCE_MS);

    // Simpan ke queue (update kalau sudah ada)
    this.queue.set(filePath, { data, timeoutId });
  }

  /**
   * Force immediate write untuk semua pending files
   * (biasanya dipanggil saat bot shutdown)
   */
  async flushAll() {
    const entries = Array.from(this.queue.entries());

    if (entries.length === 0) {
      console.log("✅ [persist] No pending writes to flush");
      return;
    }

    console.log(`💾 [persist] Flushing ${entries.length} pending writes...`);

    for (const [filePath, { data, timeoutId }] of entries) {
      clearTimeout(timeoutId); // Cancel pending timeout

      try {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
        console.log(`   ✅ Flushed: ${path.basename(filePath)}`);
      } catch (err) {
        console.error(`   ⚠️  Error flushing ${path.basename(filePath)}:`, err.message);
      }
    }

    this.queue.clear();
    console.log("✅ [persist] All writes flushed");
  }

  /**
   * Get stats (untuk debugging/monitoring)
   */
  getStats() {
    return {
      ...this.stats,
      pending: this.queue.size,
      pendingFiles: Array.from(this.queue.keys()).map(p => path.basename(p)),
    };
  }

  /**
   * Clear semua pending writes (buat testing)
   */
  clear() {
    for (const { timeoutId } of this.queue.values()) {
      clearTimeout(timeoutId);
    }
    this.queue.clear();
    this.stats = { writes: 0, debounced: 0, errors: 0 };
  }
}

const persistQueue = new PersistenceQueue();

// beforeExit (BEDA dari SIGINT/SIGTERM di index.js -- ini nembak pas event loop mau abis
// natural, bukan dari sinyal) aman didaftarin di sini karena gak manggil process.exit()
// sendiri, jadi gak ikut resiko race condition kayak dulu.
process.on("beforeExit", async () => {
  const pending = persistQueue.getStats().pending;
  if (pending > 0) {
    console.log(`⚠️  [persist] beforeExit: masih ${pending} pending writes, flushing...`);
    await persistQueue.flushAll();
  }
});

module.exports = persistQueue;
