/**
 * Kirim beberapa gambar sekaligus (galeri/carousel/slideshow) dengan rapi -- gambar PERTAMA
 * quote pesan command aslinya (lewat `reply()`, biar user gampang nemuin balasan mana yang
 * nyambung ke command mana kalau chat rame), gambar ke-2 dst dikirim POLOS langsung lewat
 * `sock.sendMessage` tanpa quote.
 *
 * KENAPA GAK QUOTE SEMUA (kayak sebelumnya): kalau tiap gambar quote ulang command aslinya,
 * WhatsApp nampilin blok "membalas [command]" berulang-ulang di TIAP gambar -- keliatan
 * berantakan/berulang pas ada 4 gambar dst. Cukup 1x aja di gambar pertama.
 *
 * KENAPA GAK PAKAI FITUR ALBUM ASLI WHATSAPP (semua foto jadi 1 bubble bisa di-swipe): Baileys
 * versi yang dipakai bot ini (6.7.24, lihat package.json) belum support itu -- fitur album baru
 * ada di Baileys 7.x yang masih release-candidate, belum stabil buat dipakai produksi. Kalau
 * nanti Baileys 7.x udah stabil dan project ini upgrade ke situ, helper ini tempat yang pas buat
 * diganti ke `sock.sendAlbumMessage()` atau API album resminya, tanpa perlu ubah pemanggil di
 * command manapun (semua udah lewat sini).
 *
 * @param {object} params
 * @param {object} params.sock - instance Baileys
 * @param {string} params.jid - tujuan chat
 * @param {(content: object) => Promise<any>} params.reply - fungsi reply() yang quote otomatis
 * @param {Buffer[]} params.buffers - daftar buffer gambar yang mau dikirim
 * @param {string} [params.caption] - caption HANYA buat gambar pertama (galeri gak perlu caption
 *   di tiap gambar, cukup 1x di awal) -- baris credit kecil otomatis ditempel di bawahnya
 */
const { withCredit } = require("./credit");

async function sendImageGallery({ sock, jid, reply, buffers, caption }) {
  for (let i = 0; i < buffers.length; i++) {
    const payload = { image: buffers[i], caption: i === 0 ? withCredit(caption) : undefined };
    if (i === 0) {
      await reply(payload);
    } else {
      await sock.sendMessage(jid, payload);
    }
  }
}

module.exports = { sendImageGallery };
