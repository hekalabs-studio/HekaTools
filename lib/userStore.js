/**
 * Penyimpanan data user pendaftaran - PERSISTEN ke file (data/users.json),
 * bukan cuma di memori. Jadi kalau bot di-restart/laptop dimatiin terus dinyalain
 * lagi, data user TETAP ADA. Cuma ilang kalau file data/users.json sengaja dihapus.
 *
 * OPTIMIZATION:
 * - Async queue write (non-blocking) — registerUser/unregisterUser langsung return
 * - Debounced (500ms) — multiple operations → 1 disk write
 * - Error handling — gagal save gak crash bot
 */
const fs = require("fs");
const path = require("path");
const persistQueue = require("./persistenceQueue");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    // Migrasi dari format lama (cuma { jid: {...} } tanpa nextId) kalau ada
    if (!raw.users) return { nextId: 1, users: raw };
    return raw;
  } catch {
    return { nextId: 1, users: {} };
  }
}

function queueSave() {
  // OPTIMIZATION: Non-blocking async queue write (instead of sync fs.writeFileSync)
  persistQueue.queueWrite(DATA_FILE, store);
}

let store = loadStore();

// Migrasi data user LAMA (dari sebelum ada id/number/active) biar gak error/ilang
(function migrateOldUsers() {
  let changed = false;
  for (const [jid, user] of Object.entries(store.users)) {
    if (!user.id) {
      user.id = `U${String(store.nextId).padStart(3, "0")}`;
      store.nextId += 1;
      changed = true;
    }
    if (!user.number) {
      user.number = jid.split("@")[0];
      changed = true;
    }
    if (user.active === undefined) {
      user.active = true;
      changed = true;
    }
  }
  if (changed) queueSave();
})();

function isRegistered(jid) {
  return Boolean(store.users[jid]);
}

function getUser(jid) {
  return store.users[jid] || null;
}

function getAllUsers() {
  return Object.values(store.users).sort((a, b) => a.id.localeCompare(b.id));
}

function getUserById(id) {
  return Object.values(store.users).find((u) => u.id.toUpperCase() === String(id).toUpperCase()) || null;
}

function registerUser(jid, data) {
  // Migrasi user lama yang belum punya id/number/active kalau perlu, sambil pastiin nextId gak nabrak
  const id = `U${String(store.nextId).padStart(3, "0")}`;
  store.nextId += 1;

  store.users[jid] = {
    id,
    name: data.name,
    number: jid.split("@")[0],
    registeredAt: new Date().toISOString(),
    active: true,
  };
  queueSave();
  return store.users[jid];
}

function unregisterUser(jid) {
  delete store.users[jid];
  queueSave();
}

/** Hapus user berdasarkan User ID (dipakai owner buat hapus akun orang lain) */
function deleteUserById(id) {
  const entry = Object.entries(store.users).find(([, u]) => u.id.toUpperCase() === String(id).toUpperCase());
  if (!entry) return null;
  const [jid, user] = entry;
  delete store.users[jid];
  queueSave();
  return user;
}

function countUsers() {
  return Object.keys(store.users).length;
}

module.exports = {
  isRegistered,
  getUser,
  getAllUsers,
  getUserById,
  registerUser,
  unregisterUser,
  deleteUserById,
  countUsers,
};
