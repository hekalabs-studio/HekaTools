/**
 * Memory leak prevention utilities.
 *
 * Helps identify and prevent common memory leak patterns:
 * 1. Event listeners not unsubscribed
 * 2. Promise chains without error handlers
 * 3. Timers not cleared
 * 4. Circular references
 *
 * Usage:
 *   const { trackEventListener, trackTimer } = require('./lib/leakPrevention');
 *   trackEventListener(emitter, 'event', handler);
 *   const timerId = trackTimer(setInterval(...));
 */

const activeListeners = new Map(); // emitter -> [{ event, handler }]
const activeTimers = new Set(); // timer IDs

/**
 * Track event listener for cleanup monitoring
 */
function trackEventListener(emitter, event, handler) {
  if (!emitter || !event) return;

  const key = `${event}`;
  if (!activeListeners.has(emitter)) {
    activeListeners.set(emitter, []);
  }
  activeListeners.get(emitter).push({ event, handler });

  // Return unsubscribe function
  return () => {
    emitter.removeListener(event, handler);
    const listeners = activeListeners.get(emitter);
    if (listeners) {
      const idx = listeners.findIndex((l) => l.event === event && l.handler === handler);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  };
}

/**
 * Track timer (setInterval/setTimeout) for cleanup
 */
function trackTimer(timerId, type = "interval") {
  activeTimers.add({ id: timerId, type, createdAt: Date.now() });
  return timerId;
}

/**
 * Clear tracked timer
 */
function untrackTimer(timerId, type = "interval") {
  type === "interval" ? clearInterval(timerId) : clearTimeout(timerId);
  for (const timer of activeTimers) {
    if (timer.id === timerId) {
      activeTimers.delete(timer);
      break;
    }
  }
}

/**
 * Get leak report (for debugging)
 */
function getLeakReport() {
  const listenerCount = Array.from(activeListeners.values()).reduce((sum, arr) => sum + arr.length, 0);
  const timerCount = activeTimers.size;

  return {
    activeListeners: listenerCount,
    activeTimers: timerCount,
    emitterCount: activeListeners.size,
    listenersByEmitter: Object.fromEntries(
      Array.from(activeListeners.entries()).map(([emitter, listeners]) => [
        emitter.constructor?.name || "Unknown",
        listeners.length,
      ])
    ),
  };
}

/**
 * Cleanup all tracked resources (usually on exit)
 */
/**
 * Dipanggil dari shutdown terpusat di index.js, BUKAN daftar handler sendiri (lihat catatan
 * di index.js soal kenapa semua shutdown logic disatuin ke satu tempat).
 */
function cleanupAll() {
  console.log("🧹 [leak-prevention] Final cleanup...");

  // Clear all timers
  for (const timer of activeTimers) {
    timer.type === "interval" ? clearInterval(timer.id) : clearTimeout(timer.id);
  }
  activeTimers.clear();

  // Report
  const report = getLeakReport();
  console.log("📊 [leak-prevention] Cleanup report:", report);
}

module.exports = {
  trackEventListener,
  trackTimer,
  untrackTimer,
  getLeakReport,
  cleanupAll,
};
