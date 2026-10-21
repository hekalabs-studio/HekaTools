const config = require("../config");

// Baris ">" di awal bikin WhatsApp nampilin teksnya abu-abu kayak kutipan (blockquote) --
// kalau mau multi-baris tetap ke-blockquote semua, TIAP baris harus mulai dengan ">" sendiri
// (WhatsApp gak nge-treat 1 blok multi-baris otomatis, per-baris).
const CREDIT_LINE = `> ${config.botName} • ${config.portfolio}\n> 💎 Top up: ${config.topup}`;

/**
 * Tempelin baris credit di bawah caption/teks yang udah ada, dipisah baris kosong.
 * Kalau caption-nya kosong (banyak command convert lokal emang gak ngasih caption apa-apa),
 * hasilnya CUMA baris credit doang -- tetap kepasang, bukan ketinggalan gara-gara gak ada teks lain.
 */
function withCredit(text) {
  const base = (text || "").trim();
  return base ? `${base}\n\n${CREDIT_LINE}` : CREDIT_LINE;
}

module.exports = { withCredit, CREDIT_LINE };
