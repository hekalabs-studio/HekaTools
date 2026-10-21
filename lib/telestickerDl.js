const axios = require("axios");
const config = require("../config");

/**
 * Download sticker pack Telegram via Bot API RESMI (bukan scraping) -- pakai method resmi
 * `getStickerSet` + `getFile` yang didokumentasikan Telegram sendiri (core.telegram.org/bots/api).
 *
 * BUTUH Bot Token gratis dari @BotFather (chat ke situ di Telegram, ketik /newbot, ikutin
 * instruksinya, copy token yang dikasih) -- isi di config.js sebagai `telegramBotToken`. Sama
 * simpelnya kayak setup Gemini API key yang udah ada di bot ini.
 *
 * KENAPA INI DIPAKAI (bukan scraping combot.org kayak yang awalnya coba di-tebak): Bot API
 * Telegram itu publik, resmi, dan didokumentasikan lengkap -- gak ada risiko berubah
 * sewaktu-waktu kayak scraping situs pihak ketiga.
 *
 * KETERBATASAN: cuma nangani sticker STATIS (format WEBP, yang mana ini FORMAT NATIF sticker
 * WhatsApp juga -- jadi bisa langsung dikirim tanpa convert apapun). Sticker ANIMASI Telegram
 * pakai format TGS (Lottie terkompresi gzip), itu BEDA format dari animated-WEBP yang dipakai
 * WhatsApp -- convert TGS ke animated-WEBP butuh render engine terpisah (rlottie dkk), di luar
 * scope command ini. Sticker animasi bakal di-skip otomatis (bukan dikirim rusak).
 */
const API_BASE = "https://api.telegram.org";

function parsePackName(input) {
  const trimmed = input.trim();
  // Bisa link penuh (t.me/addstickers/PackName) ATAU cuma nama pack-nya doang
  const linkMatch = trimmed.match(/(?:t\.me\/addstickers\/|addstickers\/)([\w]+)/i);
  return linkMatch ? linkMatch[1] : trimmed.replace(/^@/, "");
}

/** @returns {Promise<{buffers: Buffer[], title: string, skippedAnimated: number}>} */
async function downloadTelegramStickerPack(input, { maxStickers = 20 } = {}) {
  const token = config.telegramBotToken;
  if (!token) {
    throw new Error(
      "Bot Token Telegram belum diisi. Buka config.js, isi `telegramBotToken` -- gratis, tinggal " +
      "chat @BotFather di Telegram, ketik /newbot, ikutin instruksinya, copy token yang dikasih."
    );
  }

  const packName = parsePackName(input);
  if (!packName) throw new Error("Nama/link sticker pack-nya kosong.");

  const setRes = await axios.get(`${API_BASE}/bot${token}/getStickerSet`, {
    params: { name: packName },
    timeout: 20000,
  });
  if (!setRes.data?.ok) {
    throw new Error(`Telegram balikin error: ${setRes.data?.description || "sticker pack gak ketemu/nama salah"}`);
  }

  const stickerSet = setRes.data.result;
  const stickers = (stickerSet.stickers || []).slice(0, maxStickers);
  if (stickers.length === 0) throw new Error("Sticker pack ini kosong (gak ada sticker di dalamnya).");

  const buffers = [];
  let skippedAnimated = 0;
  for (const sticker of stickers) {
    // Skip sticker animasi (.tgs) -- format-nya beda dari animated-webp WhatsApp, gak bisa
    // dipakai langsung tanpa convert (lihat catatan panjang di atas)
    if (sticker.is_animated || sticker.is_video) {
      skippedAnimated++;
      continue;
    }
    try {
      const fileRes = await axios.get(`${API_BASE}/bot${token}/getFile`, {
        params: { file_id: sticker.file_id },
        timeout: 15000,
      });
      const filePath = fileRes.data?.result?.file_path;
      if (!filePath) continue;

      const downloadRes = await axios.get(`${API_BASE}/file/bot${token}/${filePath}`, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      buffers.push(Buffer.from(downloadRes.data));
    } catch {
      // 1 sticker gagal download -- skip, jangan gagalin semua pack gara-gara 1 sticker
    }
  }

  if (buffers.length === 0) {
    throw new Error(
      skippedAnimated > 0
        ? `Semua ${skippedAnimated} sticker di pack ini animasi (.tgs) -- command ini cuma bisa handle sticker statis (WEBP).`
        : "Gagal download sticker manapun dari pack ini."
    );
  }

  return { buffers, title: stickerSet.title || packName, skippedAnimated };
}

module.exports = { downloadTelegramStickerPack };
