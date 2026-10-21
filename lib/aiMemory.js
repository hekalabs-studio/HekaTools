/**
 * Riwayat chat AI per-percakapan (in-memory). Key bebas string apa aja -- commands/ai.js
 * pakai `${jid}:${senderJid}` biar tiap orang punya riwayat sendiri walau chatnya sama.
 * Format pesan yang disimpan gak dipedulikan di sini (Gemini pakai {role, parts}, provider
 * OpenAI-compatible pakai {role, content}) -- pushTurn() cuma nyimpen apa yang dikasih.
 */
const MAX_TURNS = 10; // 10 pasang user+ai (20 pesan)
const INACTIVE_EXPIRY_MS = 6 * 60 * 60 * 1000; // riwayat basi kalau nganggur 6 jam
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Bikin store riwayat chat yang berdiri sendiri, dipakai satu per provider AI (Gemini,
 * DeepSeek, dst) biar riwayat masing-masing gak nyambung satu sama lain.
 */
function createHistoryStore(label = "ai") {
  const histories = new Map(); // key -> { messages, lastActive }

  function getHistory(key) {
    return histories.get(key)?.messages || [];
  }

  function pushTurn(key, userMessage, modelMessage) {
    const entry = histories.get(key) || { messages: [], lastActive: 0 };
    entry.messages.push(userMessage, modelMessage);
    while (entry.messages.length > MAX_TURNS * 2) entry.messages.shift();
    entry.lastActive = Date.now();
    histories.set(key, entry);
  }

  function clearHistory(key) {
    histories.delete(key);
  }

  function clearAllHistories() {
    const count = histories.size;
    histories.clear();
    return count;
  }

  function cleanupInactiveHistories() {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of histories) {
      if (now - entry.lastActive > INACTIVE_EXPIRY_MS) {
        histories.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[aiMemory:${label}] bersihin ${removed} riwayat nganggur (sisa: ${histories.size})`);
    }
  }

  setInterval(cleanupInactiveHistories, CLEANUP_INTERVAL_MS).unref();

  return { getHistory, pushTurn, clearHistory, clearAllHistories };
}

// Store default dipakai lib/gemini.js. Provider lain bikin store sendiri lewat createHistoryStore().
const defaultStore = createHistoryStore("gemini");

module.exports = { ...defaultStore, createHistoryStore };
