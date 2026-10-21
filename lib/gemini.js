const httpClient = require("./httpClient"); // OPTIMIZATION: Use pooled HTTP client
const config = require("../config");
const { getHistory, pushTurn } = require("./aiMemory");

// Bersihin sisa notasi LaTeX/Markdown yang gak didukung WhatsApp.
function sanitizeForWhatsApp(text) {
  let t = text;

  t = t.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1/$2)");
  t = t.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  t = t.replace(/\\text\{([^{}]*)\}/g, "$1");

  const symbolMap = [
    [/\\times/g, "×"], [/\\cdot/g, "·"], [/\\div/g, "÷"], [/\\pm/g, "±"],
    [/\\varepsilon|\\epsilon/g, "ε"], [/\\Sigma/g, "Σ"], [/\\sigma/g, "σ"],
    [/\\Delta/g, "Δ"], [/\\pi/g, "π"], [/\\approx/g, "≈"], [/\\geq/g, "≥"],
    [/\\leq/g, "≤"], [/\\neq/g, "≠"], [/\\infty/g, "∞"], [/\\left|\\right/g, ""],
  ];
  for (const [pattern, repl] of symbolMap) t = t.replace(pattern, repl);

  t = t.replace(/\^\{([^{}]+)\}/g, "^$1");
  t = t.replace(/_\{([^{}]+)\}/g, "$1");

  t = t.replace(/\$\$([^$]+)\$\$/g, "$1");
  t = t.replace(/\$([^$]+)\$/g, "$1");

  t = t.replace(/^#{1,6}\s*(.+)$/gm, "*$1*");
  t = t.replace(/\*\*(.+?)\*\*/g, "*$1*");
  t = t.replace(/\\([a-zA-Z]+)/g, "$1");

  return t.trim();
}

// Tier gratis Gemini dibatasi request per menit per key, bukan saldo. Bisa isi beberapa key
// (dari akun Google beda-beda) di config.geminiApiKeys biar bot gantian kalau satu kena limit.
function getApiKeys() {
  if (Array.isArray(config.geminiApiKeys) && config.geminiApiKeys.length) {
    return config.geminiApiKeys.map((k) => (k || "").trim()).filter(Boolean);
  }
  return config.geminiApiKey ? [config.geminiApiKey.trim()].filter(Boolean) : [];
}

let keyCursor = 0;

function isRateLimitError(err) {
  const errData = err.response?.data?.error;
  return err.response?.status === 429 || errData?.status === "RESOURCE_EXHAUSTED";
}

// Model overload (503/UNAVAILABLE) beda dari rate limit -- ini soal kapasitas model secara
// global, bukan kuota per-key, jadi ganti key gak ngaruh. Retry-nya lebih pendek juga.
function isOverloadedError(err) {
  const errData = err.response?.data?.error;
  const message = errData?.message || err.message || "";
  return (
    err.response?.status === 503 ||
    errData?.status === "UNAVAILABLE" ||
    /overloaded|high demand/i.test(message)
  );
}

function isTimeoutError(err) {
  return err.code === "ECONNABORTED" || /timeout of \d+ms exceeded/i.test(err.message || "");
}

async function callGemini(apiKey, url, body) {
  return httpClient.post(url, body, {
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    timeout: 60000,
  });
}

function extractAnswer(res) {
  const rawAnswer = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!rawAnswer) throw new Error("Gemini gak ngasih jawaban (mungkin request-nya diblokir safety filter).");
  return rawAnswer.trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureApiKeys() {
  const keys = getApiKeys();
  if (!keys.length) {
    throw new Error(
      "API key Gemini belum diisi. Buka config.js, isi `geminiApiKey` (atau `geminiApiKeys` " +
      "buat lebih dari satu) dengan API key GRATIS kamu -- bikin gratis di https://aistudio.google.com/apikey, " +
      "gak butuh kartu kredit."
    );
  }
  return keys;
}

/**
 * Dipakai bareng oleh askGemini (teks/riwayat) dan askGeminiWithImage (vision/.solve).
 * Rate limit (429) -> coba key lain dulu, baru tunggu kalau semua kena. Overload/timeout
 * (503, "high demand") -> langsung tunggu sebentar, ganti key gak ngaruh buat kasus ini.
 * Kalau overload menetap dan geminiFallbackModel diisi, dicoba sekali lagi pakai model itu.
 */
async function generateAnswerWithModel(model, contents, systemPrompt) {
  const keys = ensureApiKeys();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = { contents, systemInstruction: { parts: [{ text: systemPrompt }] } };

  const RATE_LIMIT_RETRY_WAITS_MS = [15_000, 30_000];
  const OVERLOAD_RETRY_WAITS_MS = [3_000, 8_000];
  const MAX_ATTEMPTS = Math.max(RATE_LIMIT_RETRY_WAITS_MS.length, OVERLOAD_RETRY_WAITS_MS.length) + 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let lastErr;
    let lastErrorKind = null;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[(keyCursor + i) % keys.length];
      try {
        const res = await callGemini(key, url, body);
        keyCursor = (keyCursor + i + 1) % keys.length;
        return extractAnswer(res);
      } catch (err) {
        lastErr = err;
        if (isRateLimitError(err)) {
          lastErrorKind = "rateLimit";
          continue;
        }
        if (isOverloadedError(err) || isTimeoutError(err)) {
          lastErrorKind = "overload";
          break;
        }
        const e = new Error(err.response?.data?.error?.message || err.message);
        e.kind = "other";
        throw e;
      }
    }

    const waits = lastErrorKind === "overload" ? OVERLOAD_RETRY_WAITS_MS : RATE_LIMIT_RETRY_WAITS_MS;
    if (lastErrorKind && attempt < waits.length) {
      await sleep(waits[attempt]);
      continue;
    }

    const e = new Error(
      lastErrorKind === "rateLimit"
        ? `Lagi kena limit gratis Gemini di ${keys.length > 1 ? "semua " + keys.length + " API key" : "API key"} kamu ` +
          "(batas request per menit di tier gratis, bukan soal saldo). Bot udah otomatis coba ulang beberapa " +
          "kali tapi masih penuh. Tunggu \u00b11 menit lagi, atau tambahin API key lain di `geminiApiKeys` di config.js."
        : lastErrorKind === "overload"
        ? "overloaded"
        : lastErr?.response?.data?.error?.message || lastErr?.message || "Gagal menghubungi Gemini."
    );
    e.kind = lastErrorKind || "other";
    throw e;
  }
}

const OVERLOAD_MESSAGE =
  "Model Gemini lagi kebanjiran request dari banyak orang sekaligus (bukan soal API key/kuota " +
  "kamu). Bot udah otomatis coba ulang beberapa kali (termasuk model cadangan kalau di-setting) " +
  "tapi masih overload semua. Coba lagi beberapa saat lagi.";

let warnedSameFallback = false;

async function generateAnswer(contents, systemPrompt, customModel = null) {
  const activeModel = (customModel && customModel.trim()) || config.geminiModel;
  try {
    return await generateAnswerWithModel(activeModel, contents, systemPrompt);
  } catch (err) {
    const fallbackModel = (config.geminiFallbackModel || "").trim();
    const isSameAsMain = fallbackModel && fallbackModel === activeModel;

    // Kalau fallback keisi tapi kebetulan sama persis dengan model utama, fallback-nya gak
    // ngefek apa-apa (percuma nyoba model yang sama dua kali)
    if (isSameAsMain && !warnedSameFallback) {
      warnedSameFallback = true;
      console.warn(
        `[gemini] geminiFallbackModel ("${fallbackModel}") sama persis dengan activeModel -- ` +
        "fallback anti-overload gak akan pernah kepakai. Isi geminiFallbackModel di config.js " +
        "dengan model LAIN kalau mau fallback ini beneran aktif."
      );
    }

    if (err.kind !== "overload" || !fallbackModel || isSameAsMain) {
      throw err.kind === "overload" ? new Error(OVERLOAD_MESSAGE) : err;
    }
    try {
      return await generateAnswerWithModel(fallbackModel, contents, systemPrompt);
    } catch (fallbackErr) {
      throw fallbackErr.kind === "overload" ? new Error(OVERLOAD_MESSAGE) : fallbackErr;
    }
  }
}

async function askGemini(jid, userText, systemPrompt = config.aiSystemPrompt, customModel = null) {
  ensureApiKeys();
  const history = getHistory(jid);
  const contents = [...history, { role: "user", parts: [{ text: userText }] }];
  const answer = await generateAnswer(contents, systemPrompt, customModel);
  pushTurn(jid, { role: "user", parts: [{ text: userText }] }, { role: "model", parts: [{ text: answer }] });
  return answer;
}

// Dipakai .solve : sekali jalan, gak nyambung ke riwayat chat.
async function askGeminiWithImage(userText, imageBuffer, mimeType, systemPrompt = config.solveSystemPrompt, customModel = null) {
  ensureApiKeys();
  const promptText = userText?.trim()
    ? userText.trim()
    : "Kerjakan/selesaikan apa yang ada di foto ini.";
  const contents = [
    {
      role: "user",
      parts: [
        { text: promptText },
        { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBuffer.toString("base64") } },
      ],
    },
  ];
  return generateAnswer(contents, systemPrompt, customModel);
}

// Dipakai .solve buat file .txt : isinya digabung ke prompt sebagai teks biasa.
async function askGeminiTextOneShot(userText, systemPrompt = config.solveSystemPrompt, customModel = null) {
  ensureApiKeys();
  const contents = [{ role: "user", parts: [{ text: userText }] }];
  return generateAnswer(contents, systemPrompt, customModel);
}

module.exports = { askGemini, askGeminiWithImage, askGeminiTextOneShot };
