/**
 * Command usage statistics -- catat berapa kali tiap command dipanggil, PERSISTEN ke file.
 *
 * Berguna buat owner ngeliat command mana yang paling populer/jarang dipakai, biar bisa
 * prioritaskan fitur mana yang perlu diimprove atau dibuang. Datanya lightweight (cuma
 * counter integer per command name), gak nyimpen data sensitif apapun (gak ada JID/nama
 * user, gak ada isi pesan, gak ada timestamp per-call).
 */
const fs = require("fs");
const path = require("path");
const persistQueue = require("./persistenceQueue");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "cmdstats.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { counts: {}, totalCalls: 0, since: new Date().toISOString() };
  }
}

let store = loadStore();

// Migrasi dari format lama (kalau ada)
if (!store.counts) store = { counts: store, totalCalls: 0, since: new Date().toISOString() };
if (!store.totalCalls) store.totalCalls = Object.values(store.counts).reduce((sum, n) => sum + n, 0);
if (!store.since) store.since = new Date().toISOString();

function queueSave() {
  persistQueue.queueWrite(DATA_FILE, store);
}

/**
 * Catat 1 pemanggilan command.
 * @param {string} commandName - nama command (sudah lowercase)
 */
function recordCommandUsage(commandName) {
  store.counts[commandName] = (store.counts[commandName] || 0) + 1;
  store.totalCalls = (store.totalCalls || 0) + 1;
  queueSave();
}

/**
 * Ambil semua statistik command, diurutkan dari yang paling sering dipakai.
 * @returns {{ counts: Object, totalCalls: number, since: string, sorted: Array<[string, number]> }}
 */
function getCommandStats() {
  const sorted = Object.entries(store.counts).sort((a, b) => b[1] - a[1]);
  return {
    counts: store.counts,
    totalCalls: store.totalCalls || 0,
    since: store.since,
    sorted,
  };
}

/**
 * Reset semua statistik (owner only biasanya).
 */
function resetCommandStats() {
  store = { counts: {}, totalCalls: 0, since: new Date().toISOString() };
  queueSave();
}

module.exports = { recordCommandUsage, getCommandStats, resetCommandStats };
