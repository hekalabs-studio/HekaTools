const httpClient = require("./httpClient"); // OPTIMIZATION: Use pooled HTTP client
const config = require("../config");
const { createHistoryStore } = require("./aiMemory");

const { getHistory, pushTurn, clearAllHistories } = createHistoryStore("deepseek");

// Bersihin LaTeX/Markdown yang gak kebaca rapi di WhatsApp. Duplikat dari lib/gemini.js
// sengaja, biar tiap provider AI independen satu sama lain.
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

function getApiKeys() {
  if (Array.isArray(config.deepseekApiKeys) && config.deepseekApiKeys.length) {
    return config.deepseekApiKeys.map((k) => (k || "").trim()).filter(Boolean);
  }
  return config.deepseekApiKey ? [config.deepseekApiKey.trim()].filter(Boolean) : [];
}

let keyCursor = 0;

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

function isRateLimitError(err) {
  return err.response?.status === 429;
}

function isServerError(err) {
  const status = err.response?.status;
  return typeof status === "number" && status >= 500 && status < 600;
}

function isTimeoutError(err) {
  return err.code === "ECONNABORTED" || /timeout of \d+ms exceeded/i.test(err.message || "");
}

async function callDeepSeek(apiKey, body) {
  return httpClient.post(DEEPSEEK_API_URL, body, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    timeout: 60000,
  });
}

function extractAnswer(res) {
  const rawAnswer = res.data?.choices?.[0]?.message?.content || "";
  if (!rawAnswer) throw new Error("DeepSeek gak ngasih jawaban (respons kosong dari API).");
  return rawAnswer.trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureApiKeys() {
  const keys = getApiKeys();
  if (!keys.length) {
    throw new Error(
      "API key DeepSeek belum diisi. Buka .env, isi `DEEPSEEK_API_KEY_1` (atau _2/_3 buat lebih " +
      "dari satu) dengan API key kamu -- daftar & bikin key di https://platform.deepseek.com/api_keys " +
      "(perlu top-up saldo, beda dari Gemini yang gratis)."
    );
  }
  return keys;
}

async function generateAnswer(messages, customModel = null) {
  const keys = ensureApiKeys();
  const activeModel = (customModel && customModel.trim()) || config.deepseekModel;
  const body = { model: activeModel, messages, stream: false };

  const RATE_LIMIT_RETRY_WAITS_MS = [15_000, 30_000];
  const SERVER_ERROR_RETRY_WAITS_MS = [3_000, 8_000];
  const MAX_ATTEMPTS = Math.max(RATE_LIMIT_RETRY_WAITS_MS.length, SERVER_ERROR_RETRY_WAITS_MS.length) + 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let lastErr;
    let lastErrorKind = null;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[(keyCursor + i) % keys.length];
      try {
        const res = await callDeepSeek(key, body);
        keyCursor = (keyCursor + i + 1) % keys.length;
        return extractAnswer(res);
      } catch (err) {
        lastErr = err;
        if (isRateLimitError(err)) {
          lastErrorKind = "rateLimit";
          continue;
        }
        if (isServerError(err) || isTimeoutError(err)) {
          lastErrorKind = "serverError";
          break;
        }
        const e = new Error(err.response?.data?.error?.message || err.message);
        e.kind = "other";
        throw e;
      }
    }

    const waits = lastErrorKind === "serverError" ? SERVER_ERROR_RETRY_WAITS_MS : RATE_LIMIT_RETRY_WAITS_MS;
    if (lastErrorKind && attempt < waits.length) {
      await sleep(waits[attempt]);
      continue;
    }

    const e = new Error(
      lastErrorKind === "rateLimit"
        ? `Lagi kena limit DeepSeek di ${keys.length > 1 ? "semua " + keys.length + " API key" : "API key"} kamu. ` +
          "Bot udah otomatis coba ulang beberapa kali tapi masih penuh. Tunggu sebentar lagi baru coba, " +
          "atau tambahin API key lain di `DEEPSEEK_API_KEY_2`/`_3` di file .env."
        : lastErrorKind === "serverError"
        ? "Server DeepSeek lagi gangguan/sibuk sementara. Coba lagi beberapa saat lagi."
        : lastErr?.response?.data?.error?.message || lastErr?.message || "Gagal menghubungi DeepSeek."
    );
    e.kind = lastErrorKind || "other";
    throw e;
  }
}

async function askDeepSeek(jid, userText, systemPrompt = config.aiSystemPrompt, customModel = null) {
  ensureApiKeys();
  const history = getHistory(jid);
  const messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: userText }];
  const answer = await generateAnswer(messages, customModel);
  pushTurn(jid, { role: "user", content: userText }, { role: "assistant", content: answer });
  return answer;
}

module.exports = { askDeepSeek, clearAllDeepSeekHistories: clearAllHistories };
