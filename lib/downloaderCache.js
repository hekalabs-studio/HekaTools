const NodeCache = require("node-cache");

/**
 * Cache manager untuk downloader hasil.
 *
 * Use case:
 * - User A download TikTok video → cache result 10 menit
 * - User B download SAME video dalam 10 menit → return cached (instant)
 * - User C download DIFFERENT video → fresh fetch
 *
 * Manfaat:
 * 1. Instant result untuk URL yang sama (cache hit)
 * 2. Mengurangi beban ke external API/server
 * 3. Auto-expiry dengan TTL
 * 4. Simple key-value interface
 *
 * Usage:
 *   const downloaderCache = require('./lib/downloaderCache');
 *   const cached = downloaderCache.get('tiktok', urlHash);
 *   if (cached) return cached;
 *   const result = await fetchVideo(url);
 *   downloaderCache.set('tiktok', urlHash, result);
 *   return result;
 */

class DownloaderCache {
  constructor() {
    // TTL: 10 menit (video metadata jarang berubah)
    // Backup: max 100 entries (biar gak besar memory)
    this.cache = new NodeCache({ stdTTL: 10 * 60, checkperiod: 60 * 60 });
    this.stats = { hits: 0, misses: 0, set: 0 };
  }

  makeKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  /**
   * Get dari cache
   * @param {string} prefix - Service prefix (tiktok, youtube, facebook, dll)
   * @param {string} identifier - URL hash atau identifier
   * @returns {any} Cached value atau undefined
   */
  get(prefix, identifier) {
    const key = this.makeKey(prefix, identifier);
    const value = this.cache.get(key);
    if (value) {
      this.stats.hits++;
      console.log(`✅ [downloader-cache] HIT (${prefix}): ${identifier.slice(0, 8)}`);
    } else {
      this.stats.misses++;
    }
    return value;
  }

  /**
   * Set ke cache
   * @param {string} prefix - Service prefix
   * @param {string} identifier - URL hash atau identifier
   * @param {any} value - Value to cache
   */
  set(prefix, identifier, value) {
    const key = this.makeKey(prefix, identifier);
    this.cache.set(key, value);
    this.stats.set++;
    console.log(`💾 [downloader-cache] SET (${prefix}): ${identifier.slice(0, 8)}`);
  }

  /**
   * Get stats untuk debugging
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : 0;
    return { ...this.stats, hitRate: `${hitRate}%` };
  }

  /**
   * Clear semua cache
   */
  clear() {
    this.cache.flushAll();
    this.stats = { hits: 0, misses: 0, set: 0 };
  }
}

const cache = new DownloaderCache();
module.exports = cache;
