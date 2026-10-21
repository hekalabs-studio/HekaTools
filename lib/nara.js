const axios = require("axios");
const config = require("../config");

/**
 * Generate gambar via NaraRouter. Dua strategi endpoint dicoba otomatis: format klasik
 * OpenAI Images API dulu, fallback ke chat completions kalau 404. Download gambar hasil
 * generate ikut nyertain Authorization header karena URL-nya butuh auth juga, bukan publik.
 */

const NARA_DASHBOARD_ROOT = config.naraBaseUrl.replace(/\/v1\/?$/, "");

function getApiKeys() {
  if (Array.isArray(config.naraApiKeys) && config.naraApiKeys.length) {
    return config.naraApiKeys.map((k) => (k || "").trim()).filter(Boolean);
  }
  return config.naraApiKey ? [config.naraApiKey.trim()].filter(Boolean) : [];
}

let keyCursor = 0;

function isNotFoundError(err) {
  return err.response?.status === 404;
}

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

function isPaymentError(err) {
  return err.response?.status === 402;
}

/**
 * Ubah Base64 Data URI atau URL HTTP(S)/Relatif menjadi Buffer.
 * Menyertakan header Authorization agar download dari endpoint internal NaraRouter tidak kena HTTP 401.
 */
async function urlOrDataUriToBuffer(urlOrDataUri, apiKey = "") {
  if (!urlOrDataUri || typeof urlOrDataUri !== "string") {
    throw new Error("URL atau data URI gambar tidak valid (kosong/undefined).");
  }

  const trimmed = urlOrDataUri.trim();

  // 1. Data URI Base64
  if (trimmed.startsWith("data:")) {
    const base64 = trimmed.split(",")[1] || "";
    return Buffer.from(base64, "base64");
  }

  // 2. Format URL (Absolut maupun Relatif)
  let absoluteUrl = trimmed;
  if (!/^https?:\/\//i.test(absoluteUrl)) {
    absoluteUrl = NARA_DASHBOARD_ROOT.replace(/\/$/, "") + (absoluteUrl.startsWith("/") ? "" : "/") + absoluteUrl;
  }

  try {
    const headers = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const imgRes = await axios.get(absoluteUrl, {
      responseType: "arraybuffer",
      headers,
      timeout: 30000,
    });
    return Buffer.from(imgRes.data);
  } catch (err) {
    throw new Error(
      `Gagal mendownload gambar dari URL ("${urlOrDataUri}", dicoba sebagai "${absoluteUrl}"): ${err.message}`
    );
  }
}

// ============================================================================================
// STRATEGI 1: Endpoint Klasik OpenAI Images API (POST /v1/images/generations)
// ============================================================================================
const classicImagesStrategy = {
  name: "images/generations (klasik)",
  endpoint: `${config.naraBaseUrl}/images/generations`,
  buildBody(prompt) {
    return {
      model: config.naraImageModel,
      prompt,
      n: 1,
      size: config.naraImageSize,
    };
  },
  async extractImageBuffer(res, apiKey) {
    const item = res.data?.data?.[0];
    if (!item) {
      throw new Error(
        "NaraRouter tidak mengembalikan `data[0]`. Respons mentah: " +
        JSON.stringify(res.data).slice(0, 500)
      );
    }
    if (item.b64_json) return Buffer.from(item.b64_json, "base64");

    const rawUrl = item.url || item.image_url || item.image;
    if (rawUrl) return await urlOrDataUriToBuffer(rawUrl, apiKey);

    throw new Error("NaraRouter mengembalikan `data[0]` tanpa `b64_json` atau URL valid. Isi: " + JSON.stringify(item).slice(0, 500));
  },
};

// ============================================================================================
// STRATEGI 2 (Fallback): Chat Completions API (POST /v1/chat/completions)
// ============================================================================================
const chatCompletionsStrategy = {
  name: "chat/completions (fallback image-in-chat)",
  endpoint: `${config.naraBaseUrl}/chat/completions`,
  buildBody(prompt) {
    return {
      model: config.naraImageModel,
      messages: [{ role: "user", content: prompt }],
      size: config.naraImageSize,
      modalities: ["image", "text"],
    };
  },
  async extractImageBuffer(res, apiKey) {
    const message = res.data?.choices?.[0]?.message;
    if (!message) {
      throw new Error(
        "NaraRouter tidak mengembalikan `choices[0].message`. Respons mentah: " + JSON.stringify(res.data).slice(0, 500)
      );
    }

    // A. Array message.images[]
    if (Array.isArray(message.images) && message.images.length) {
      const imgUrl = message.images[0]?.image_url?.url || message.images[0]?.url;
      if (imgUrl) return await urlOrDataUriToBuffer(imgUrl, apiKey);
    }

    // B. Array message.content[] (Multimodal)
    if (Array.isArray(message.content)) {
      const imgPart = message.content.find((part) => part.type === "image_url" || part.image_url);
      if (imgPart) {
        const imgUrl = imgPart.image_url?.url || imgPart.url;
        if (imgUrl) return await urlOrDataUriToBuffer(imgUrl, apiKey);
      }
    }

    // C. String message.content (Base64 atau URL Markdown/Teks biasa)
    if (typeof message.content === "string") {
      const contentStr = message.content.trim();

      if (/^data:image\//.test(contentStr)) {
        return await urlOrDataUriToBuffer(contentStr, apiKey);
      }

      const matchUrl = contentStr.match(/https?:\/\/[^\s\)\"]+/);
      if (matchUrl) {
        return await urlOrDataUriToBuffer(matchUrl[0], apiKey);
      }
    }

    throw new Error(
      "NaraRouter mengembalikan respons chat completions, tetapi bot tidak menemukan gambar di dalamnya. " +
      "Bentuk message: " + JSON.stringify(message).slice(0, 800)
    );
  },
};

async function callNara(endpoint, apiKey, body) {
  return axios.post(endpoint, body, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    timeout: 90000,
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureApiKeys() {
  const keys = getApiKeys();
  if (!keys.length) {
    throw new Error(
      "API key NaraRouter belum diisi. Isi `NARA_API_KEY_1` di file .env -- " +
      "buat key di " + NARA_DASHBOARD_ROOT + "/keys. Pastikan akun memiliki saldo aktif."
    );
  }
  return keys;
}

async function tryStrategy(strategy, prompt, keys) {
  const body = strategy.buildBody(prompt);

  const RATE_LIMIT_RETRY_WAITS_MS = [15_000, 30_000];
  const SERVER_ERROR_RETRY_WAITS_MS = [3_000, 8_000];
  const MAX_ATTEMPTS = Math.max(RATE_LIMIT_RETRY_WAITS_MS.length, SERVER_ERROR_RETRY_WAITS_MS.length) + 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let lastErr;
    let lastErrorKind = null;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[(keyCursor + i) % keys.length];
      try {
        const res = await callNara(strategy.endpoint, key, body);

        // Tangani HTTP Status 200 yang membungkus pesan error
        if (res.data?.error) {
          const upstreamErr = new Error(res.data.error.message || "NaraRouter mengembalikan error tanpa detail.");
          upstreamErr.isNaraUpstreamError = true;
          throw upstreamErr;
        }

        keyCursor = (keyCursor + i + 1) % keys.length;
        // MENGIRIMKAN KEY UNTUK DIGUNAKAN SAAT DOWNLOAD GAMBAR (OAUTH / 401 PREVENTION)
        return await strategy.extractImageBuffer(res, key);
      } catch (err) {
        lastErr = err;

        if (isNotFoundError(err)) {
          const e = new Error(`Endpoint ${strategy.endpoint} mengembalikan 404 Not Found.`);
          e.kind = "notFound";
          throw e;
        }
        if (isRateLimitError(err)) {
          lastErrorKind = "rateLimit";
          continue;
        }
        if (isPaymentError(err)) {
          lastErrorKind = "payment";
          continue;
        }
        if (isServerError(err) || isTimeoutError(err) || err.isNaraUpstreamError) {
          lastErrorKind = "serverError";
          break;
        }
        const e = new Error(err.response?.data?.error?.message || err.message);
        e.kind = "other";
        throw e;
      }
    }

    if (lastErrorKind === "payment") {
      const e = new Error(
        `Saldo NaraRouter ${keys.length > 1 ? "di semua akun" : "kamu"} telah habis. ` +
        "Isi saldo terlebih dahulu di " + NARA_DASHBOARD_ROOT
      );
      e.kind = "payment";
      throw e;
    }

    const waits = lastErrorKind === "serverError" ? SERVER_ERROR_RETRY_WAITS_MS : RATE_LIMIT_RETRY_WAITS_MS;
    if ((lastErrorKind === "rateLimit" || lastErrorKind === "serverError") && attempt < waits.length) {
      await sleep(waits[attempt]);
      continue;
    }

    const e = new Error(
      lastErrorKind === "rateLimit"
        ? `Lagi kena rate limit di NaraRouter API Key kamu.`
        : lastErrorKind === "serverError"
        ? `Provider gambar NaraRouter ("${config.naraImageModel}") sedang mengalami gangguan sementara: "${lastErr?.message || "terjadi kesalahan"}".`
        : lastErr?.response?.data?.error?.message || lastErr?.message || "Gagal menghubungi NaraRouter."
    );
    e.kind = lastErrorKind || "other";
    throw e;
  }
}

/**
 * Generate gambar dari prompt teks via NaraRouter.
 *
 * @param {string} prompt - Deskripsi gambar yang mau dibuat
 * @returns {Promise<Buffer>} Buffer gambar siap dikirim ke WhatsApp
 */
async function generateNaraImage(prompt) {
  const keys = ensureApiKeys();
  try {
    return await tryStrategy(classicImagesStrategy, prompt, keys);
  } catch (err) {
    if (err.kind !== "notFound") throw err;
    return await tryStrategy(chatCompletionsStrategy, prompt, keys);
  }
}

module.exports = { generateNaraImage };
