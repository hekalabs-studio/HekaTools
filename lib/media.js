/** Ambil object message yang di-quote/reply, kalau ada */
function getQuoted(m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.quotedMessage) return null;
  return {
    key: {
      remoteJid: m.key.remoteJid,
      id: ctx.stanzaId,
      participant: ctx.participant,
    },
    message: ctx.quotedMessage,
  };
}

/**
 * Cari tipe media (image/video/audio/document/sticker) dari sebuah message object (sudah di-unwrap).
 * PENTING soal documentMessage: Baileys (dan WhatsApp) suka MEMBUNGKUS pesan dokumen jadi
 * `documentWithCaptionMessage` (dokumen asli ada di `documentWithCaptionMessage.message.documentMessage`)
 * -- ini kejadian bukan cuma kalau user beneran ngasih caption, tapi juga buat dokumen yang
 * dikirim dengan fileName (termasuk SEMUA file yang bot INI sendiri kirim balik lewat fitur
 * kayak .ytmp3/.tomp3/dst, lihat lib/audioReply.js). SEBELUMNYA fungsi ini cuma cek
 * `message.documentMessage` langsung -- jadi kalau user reply/quote dokumen yang kebungkus
 * begini (misal mp3 hasil .ytmp3 yang mau di-.tovn-in), balik null / dianggap "gak ada media
 * sama sekali", padahal medianya ada. Makanya sekarang dicek juga bungkusnya.
 */
function getMediaType(message) {
  if (!message) return null;
  if (message.imageMessage) return "image";
  if (message.videoMessage) return "video";
  if (message.audioMessage) return "audio";
  if (message.documentMessage) return "document";
  if (message.documentWithCaptionMessage?.message?.documentMessage) return "document";
  if (message.stickerMessage) return "sticker";
  return null;
}

/** Ambil object documentMessage ASLI dari sebuah message object, tembus bungkus documentWithCaptionMessage kalau ada */
function unwrapDocumentMessage(message) {
  return message?.documentMessage || message?.documentWithCaptionMessage?.message?.documentMessage || null;
}

const MIME_TO_EXT = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "application/zip": "zip",
  "application/vnd.rar": "rar",
};

/** Cari ekstensi ASLI sebuah dokumen dari fileName-nya (prioritas) atau mimetype (fallback) */
function getDocumentExt(documentMessage) {
  const fileName = documentMessage?.fileName || "";
  const match = fileName.match(/\.([a-zA-Z0-9]+)$/);
  if (match) return match[1].toLowerCase();
  return MIME_TO_EXT[documentMessage?.mimetype] || "bin";
}

/** Ambil nama file ASLI tanpa ekstensi (buat dipakai lagi di nama file hasil convert) */
function getBaseName(documentMessage) {
  const fileName = documentMessage?.fileName || "";
  const withoutExt = fileName.replace(/\.[a-zA-Z0-9]+$/, "").trim();
  return withoutExt || null;
}

/**
 * Cari media di pesan langsung ATAU di pesan yang di-reply.
 * Return { type, buffer, ext, baseName } atau null kalau tidak ada media.
 * `baseName` = nama file ASLI dari user (tanpa ekstensi), null kalau gak ada (gambar/video/dst
 * emang gak punya nama file dari WhatsApp).
 */
async function resolveMedia(sock, m) {
  const { normalizeMessageContent, downloadMediaMessage } = await import("@whiskeysockets/baileys");

  const directContent = normalizeMessageContent(m.message);
  const direct = getMediaType(directContent);

  const quotedMsgObj = getQuoted(m);
  const quotedContent = quotedMsgObj ? normalizeMessageContent(quotedMsgObj.message) : null;
  const quoted = getMediaType(quotedContent);

  const targetMsg = direct ? m : quoted ? quotedMsgObj : null;
  const targetContent = direct ? directContent : quoted ? quotedContent : null;
  const type = direct || quoted;
  if (!targetMsg || !type) return null;

  // downloadMediaMessage sendiri sudah otomatis unwrap pembungkus di atas, jadi aman dikasih targetMsg asli
  const buffer = await downloadMediaMessage(targetMsg, "buffer", {});

  let ext;
  let baseName = null;
  let mimetype = null;
  if (type === "document") {
    const docMessage = unwrapDocumentMessage(targetContent);
    ext = getDocumentExt(docMessage);
    baseName = getBaseName(docMessage);
    // Dikasih balik juga apa adanya -- BEDA dari `ext` (yang ditebak dari nama file, bisa meleset
    // kalau nama filenya gak standar/ada karakter aneh yang bikin regex ekstensi gak match). Ini
    // dipakai command kayak tovn sebagai sinyal CADANGAN yang lebih bisa diandalkan buat nentuin
    // "ini beneran audio/video atau bukan", karena mimetype dari WhatsApp gak bisa disunting user.
    mimetype = docMessage?.mimetype || null;
  } else {
    ext = { image: "jpg", video: "mp4", audio: "mp3", sticker: "webp" }[type] || "bin";
    mimetype = targetContent?.[`${type}Message`]?.mimetype || null;
  }

  return { type, buffer, ext, baseName, mimetype };
}

/** Ambil teks dari pesan (caption atau body biasa), termasuk dari pesan yang di-reply */
function getText(m) {
  const msg = m.message;
  // documentMessage yang dikirim DENGAN caption dibungkus WhatsApp ke documentWithCaptionMessage,
  // makanya caption-nya harus diambil dari situ, bukan langsung dari msg.documentMessage
  const unwrapped = msg?.documentWithCaptionMessage?.message;
  return (
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    msg?.documentMessage?.caption ||
    unwrapped?.documentMessage?.caption ||
    ""
  );
}

/**
 * Ambil teks dari pesan yang DI-QUOTE/reply oleh user (bukan teks yang lagi diketik user
 * sekarang). Dipakai fitur *.ai* biar bisa "nyambungin" konteks obrolan sebelumnya -- misal
 * user reply hasil *.wikipedia* terus nanya *.ai apakah itu dapat membuat rupiah menguat lagi?*,
 * bot jadi ngerti "itu" ngerujuk ke isi artikel yang di-reply. Return "" kalau gak ada reply
 * sama sekali, atau pesan yang di-reply gak punya teks (misal cuma gambar tanpa caption).
 */
function getQuotedText(m) {
  const quotedMsgObj = getQuoted(m);
  if (!quotedMsgObj) return "";
  const msg = quotedMsgObj.message;
  const unwrapped = msg?.documentWithCaptionMessage?.message;
  return (
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    msg?.documentMessage?.caption ||
    unwrapped?.documentMessage?.caption ||
    ""
  );
}

/** Ambil foto profil WhatsApp seseorang (return null kalau gak ada/private/gagal) */
async function getProfilePicture(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    const axios = require("axios");
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

module.exports = { getQuoted, getMediaType, unwrapDocumentMessage, resolveMedia, getText, getQuotedText, getProfilePicture };
