/**
 * Global query cache untuk AI APIs dengan TTL (Time To Live).
 *
 * Manfaat:
 * 1. Deduplikasi — query sama → cached result (instant)
 * 2. Cost reduction — 30-50% fewer API calls
 * 3. Latency improvement — cached = <100ms
 * 4. TTL management — stale data auto-purged
 * 5. Rate limit friendly — fewer calls = less likely to hit limit
 *
 * Usage:
 *   const queryCache = require('./lib/queryCache');
 *   // Check cache
 *   const cached = queryCache.get('gemini', prompt, 30*60); // 30 min TTL
 *   if (cached) return cached;
 *   // Set cache
 *   const result = await askGemini(prompt);
 *   queryCache.set('gemini', prompt, result);
 *   return result;
 */

const crypto = require("crypto");

class QueryCache {
  constructor() {
    this.cache = new Map(); // hash -> { result, timestamp }
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
    };
    this.DEFAULT_TTL_SEC = 30 * 60; // 30 menit default

    // Cleanup stale entries setiap 5 menit
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupInterval.unref?.();
  }

  /**
   * Buat unique hash dari provider + prompt
   * Hash biar key gak terlalu panjang di memory
   * @returns {string} 16-char hash
   */
  makeKey(provider, prompt) {
    const combined = `${provider}:${prompt}`;
    const hash = crypto.createHash("sha256").update(combined).digest("hex");
    return hash.slice(0, 16); // 16 char hash
  }

  /**
   * Get dari cache kalau ada & belum expired
   * @param {string} provider - Provider name (gemini, groq, deepseek, mistral)
   * @param {string} prompt - Query text
   * @param {number} ttlSec - TTL dalam detik (default: 30 menit)
   * @returns {string|null} Cached result atau null kalau miss/expired
   */
  get(provider, prompt, ttlSec = this.DEFAULT_TTL_SEC) {
    const key = this.makeKey(provider, prompt);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const age = (Date.now() - entry.timestamp) / 1000;
    if (age > ttlSec) {
      // Expired
      this.cache.delete(key);
      this.stats.evictions++;
      return null;
    }

    // HIT!
    this.stats.hits++;
    const promptPreview = prompt.slice(0, 50).replace(/\n/g, " ");
    console.log(`✅ [cache] HIT (${provider}, age=${Math.round(age)}s): "${promptPreview}..."`);
    return entry.result;
  }

  /**
   * Set ke cache
   * @param {string} provider - Provider name
   * @param {string} prompt - Query text
   * @param {string} result - Result to cache
   */
  set(provider, prompt, result) {
    const key = this.makeKey(provider, prompt);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
    this.stats.sets++;

    const promptPreview = prompt.slice(0, 50).replace(/\n/g, " ");
    console.log(`💾 [cache] SET (${provider}): "${promptPreview}..." (cache size: ${this.cache.size})`);
  }

  /**
   * Cleanup expired entries
   * @param {number} ttlSec - TTL untuk cleanup (default: 30 menit)
   */
  cleanup(ttlSec = this.DEFAULT_TTL_SEC) {
    let evicted = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if ((now - entry.timestamp) / 1000 > ttlSec) {
        this.cache.delete(key);
        evicted++;
      }
    }

    if (evicted > 0) {
      console.log(`🧹 [cache] Cleanup: ${evicted} expired entries removed (cache size: ${this.cache.size})`);
    }
  }

  /**
   * Get stats (untuk monitoring/debugging)
   * @returns {object} Stats object
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : "0";
    const estimatedMemoryKB = (this.cache.size * 2).toFixed(1); // rough estimate

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      sets: this.stats.sets,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      estimatedMemory: `~${estimatedMemoryKB} KB`,
    };
  }

  /**
   * Clear semua cache (buat testing)
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0 };
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
    console.log("🛑 [cache] Shutdown, final stats:", this.getStats());
  }
}

const cache = new QueryCache();

// Log stats setiap jam
const statsInterval = setInterval(() => {
  const stats = cache.getStats();
  console.log("📊 [cache] Hourly stats:", stats);
}, 60 * 60 * 1000);
statsInterval.unref?.(); // Don't keep process alive just for stats

module.exports = cache;
