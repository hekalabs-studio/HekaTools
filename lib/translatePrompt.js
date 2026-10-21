const { askGeminiTextOneShot } = require("./gemini");

// Model image generation kebanyakan (termasuk yang dipakai NaraRouter) dilatih mayoritas dari
// data caption berbahasa Inggris -- prompt yang ditulis dalam bahasa lain (Indonesia, campuran,
// dll) sering ke-interpretasi kurang presisi/detail-nya ilang. Jadi sebelum dikirim ke NaraRouter,
// prompt user diterjemahin dulu ke Inggris lewat Gemini (satu kali panggilan, gak nyambung ke
// riwayat chat -- lihat askGeminiTextOneShot).
const TRANSLATE_SYSTEM_PROMPT =
  "You are a translator for AI image generation prompts. Translate the user's message into " +
  "natural, descriptive English, optimized as a prompt for an image generation model. Keep all " +
  "concrete details (subjects, colors, style, composition, mood) intact -- don't add new ideas " +
  "that weren't implied, and don't remove any. If the message is already in English, just clean " +
  "it up lightly (fix obvious typos) without changing its meaning. Reply with ONLY the translated " +
  "prompt text, no quotes, no explanation, no preamble.";

/**
 * Terjemahin prompt gambar ke Inggris. Kalau gagal (API key belum diisi, lagi kena rate limit,
 * dst), JANGAN sampai gagalin seluruh proses generate gambar cuma gara-gara terjemahannya gagal --
 * balikin prompt asli apa adanya sebagai fallback, generate gambar tetap lanjut jalan.
 */
async function translateImagePrompt(prompt) {
  try {
    const translated = await askGeminiTextOneShot(prompt, TRANSLATE_SYSTEM_PROMPT);
    return translated?.trim() || prompt;
  } catch (err) {
    console.warn(`[translateImagePrompt] Gagal nerjemahin, pakai prompt asli sebagai fallback: ${err.message}`);
    return prompt;
  }
}

module.exports = { translateImagePrompt };
