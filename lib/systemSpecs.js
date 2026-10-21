const os = require("os");
const fs = require("fs");
const path = require("path");
const config = require("../config");

// Di bawah ini otomatis dianggap "low-spec" pas mode-nya "auto". 4GB dipilih karena command
// berat (LibreOffice, ffmpeg video, model AI removebg/upscale) gampang banget nyundul >1-2GB
// RAM sendiri-sendiri kalau dipakai bareng OS + Node + WA socket.
const RAM_THRESHOLD_GB = 4;

function getTotalRamGB() {
  return os.totalmem() / 1024 ** 3;
}

const totalRamGB = getTotalRamGB();

// Setting mode (low/auto/high) disimpan di data/mode.json biar kalau diubah lewat command
// .mode, tetap kepakai walau bot di-restart -- gak balik ke config.js tiap kali nyala ulang.
// Kalau file ini belum ada (belum pernah diubah lewat command), performanceMode di config.js
// yang jadi acuan awal.
const DATA_DIR = path.join(__dirname, "..", "data");
const MODE_FILE = path.join(DATA_DIR, "mode.json");
const VALID_SETTINGS = ["low", "auto", "high"];

function readSavedSetting() {
  try {
    const raw = JSON.parse(fs.readFileSync(MODE_FILE, "utf8"));
    if (VALID_SETTINGS.includes(raw.setting)) return raw.setting;
  } catch {
    // belum pernah disave / filenya rusak -- pakai default dari config.js
  }
  return null;
}

let currentSetting = readSavedSetting() || config.performanceMode || "auto";

/** Setting mentah yang lagi aktif ("low"/"auto"/"high"), bukan hasil resolve-nya */
function getModeSetting() {
  return currentSetting;
}

/** Ubah setting mode + simpan ke disk, dipanggil dari command .mode */
function setMode(newSetting) {
  if (!VALID_SETTINGS.includes(newSetting)) {
    throw new Error(`Mode harus salah satu dari: ${VALID_SETTINGS.join(", ")}`);
  }
  currentSetting = newSetting;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MODE_FILE, JSON.stringify({ setting: newSetting }, null, 2));
  return getMode();
}

/** Mode yang beneran aktif ("low" atau "high" doang) -- "auto" di-resolve based on RAM device */
function getMode() {
  if (currentSetting === "low" || currentSetting === "high") return currentSetting;
  return totalRamGB < RAM_THRESHOLD_GB ? "low" : "high"; // auto
}

/** Command berat aktif/nggak berdasarkan mode SAAT INI JUGA (bukan cache dari pas bot start) */
function isLowSpec() {
  return getMode() === "low";
}

// ==== CEK RAM BEBAS SECARA LIVE (real-time, bukan cuma total RAM device) ====
// isLowSpec di atas berdasarkan setting mode (low/auto/high) yang statusnya cuma berubah kalau
// ownernya ganti lewat .mode. Ini beda: dicek TIAP KALI mau jalanin command berat, buat tau
// kondisi RAM SAAT ITU JUGA -- soalnya RAM device yang gedenya cukup pun bisa penuh sementara
// kalau lagi banyak command berat numpuk dari banyak orang sekaligus.
const RAM_FREE_CRITICAL_PERCENT = 10; // di bawah ini dianggap "RAM penuh"

function getFreeRamPercent() {
  return (os.freemem() / os.totalmem()) * 100;
}

function getFreeRamMB() {
  return os.freemem() / (1024 * 1024);
}

function isRamCritical() {
  if (global.gc && isLowSpec()) {
    try { global.gc(); } catch {}
  }
  // Di device low-spec (misal laptop RAM 2GB), 10% cuma tersisa ~190MB.
  // Jika RAM di bawah 180MB atau <12% di Windows dengan HDD 5400RPM,
  // disk swapping sudah sangat parah dan berisiko freeze total.
  if (isLowSpec()) {
    return getFreeRamMB() < 180 || getFreeRamPercent() < 12;
  }
  return getFreeRamPercent() < RAM_FREE_CRITICAL_PERCENT;
}

/** Dipanggil sekali pas bot start biar keliatan di log kenapa mode-nya kepilih gitu. */
function logSpecs() {
  const cpuModel = os.cpus()?.[0]?.model?.trim() || "tidak diketahui";
  const cpuCount = os.cpus()?.length || 0;
  const mode = getMode();

  console.log(`\n🖥️  Spesifikasi terdeteksi: ${cpuModel} (${cpuCount} core), RAM ${totalRamGB.toFixed(1)}GB`);
  console.log(
    `⚙️  Mode performa: ${mode.toUpperCase()}` +
    (currentSetting === "auto"
      ? ` (otomatis -- RAM ${totalRamGB < RAM_THRESHOLD_GB ? "di bawah" : "di atas/sama dengan"} ${RAM_THRESHOLD_GB}GB)`
      : ` (dipaksa manual -- setting: ${currentSetting})`)
  );
  if (mode === "low") {
    console.log(
      "   -> Mode LOW aktif (Semua Fitur Aktif & Dioptimasi Adaptif untuk Low-End Device):\n" +
      "      • Semua fitur tetap AKTIF (removebg, bratvid, togif, tomp4, dokumen office bisa digunakan).\n" +
      "      • Removebg otomatis pra-resize ke 512px agar model AI ONNX hemat RAM & tidak OOM.\n" +
      "      • Bratvid & video stiker dirender efisien dengan preset ultrafast & 1 thread CPU.\n" +
      "      • Downloader video dioptimasi ke maks 480p, file maks 30MB, dan antrean serial 1 proses.\n" +
      "      • Memory guard aktif untuk melindungi sistem dari kehabisan RAM.\n"
    );
  } else {
    console.log("   -> Semua fitur aktif (High Performance Mode).\n");
  }
}

module.exports = {
  isLowSpec,
  getMode,
  getModeSetting,
  setMode,
  totalRamGB,
  RAM_THRESHOLD_GB,
  logSpecs,
  isRamCritical,
  getFreeRamPercent,
  getFreeRamMB,
  RAM_FREE_CRITICAL_PERCENT,
};
