/**
 * Retry helper dengan exponential backoff.
 *
 * Exponential backoff: 1s, 2s, 4s, 8s, 16s
 * = Tidak hammer server kalau lagi down
 * = Lebih friendly daripada immediate retry
 *
 * Usage:
 *   const result = await retryWithBackoff(
 *     async () => await axios.get(url),
 *     3,      // max retries
 *     1000    // initial delay (ms)
 *   );
 */

async function retryWithBackoff(asyncFn, maxRetries = 3, initialDelayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;

      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      const delaySec = (delayMs / 1000).toFixed(1);
      console.log(`⚠️  [retry] Attempt ${attempt}/${maxRetries} failed, retry in ${delaySec}s... (${err.message?.slice(0, 50)})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

module.exports = { retryWithBackoff };
