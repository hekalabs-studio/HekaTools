const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const os = require("os");
const config = require("../config");

// Modul fitur HekaBot yang sudah ada
const { makeBratImageAsync } = require("../lib/bratCanvasAsync");
const { BRAT_COLORS } = require("../lib/bratCanvas");
const { askGemini, askGeminiWithImage, askGeminiTextOneShot } = require("../lib/gemini");
const { askGroq } = require("../lib/groq");
const { askDeepSeek } = require("../lib/deepseek");
const { askMistral } = require("../lib/mistral");
const { recognizeText } = require("../lib/ocr");
const { downloadVideoViaTikwm, downloadAudioViaTikwm } = require("../lib/tikwm");
const { downloadCapcutTemplate } = require("../lib/capcutDl");
const { downloadFromPinterestLink } = require("../lib/pinterestDl");
const { cekTagihanPln } = require("../lib/cekPlnDl");
const { removeBg } = require("../lib/removebg");
const { toMp3, toVoiceNote } = require("../lib/ffmpeg");
const { makeBratVideo } = require("../lib/bratvid");
const { makeQuoteCardV2 } = require("../lib/textImage");
const { upscaleImage } = require("../lib/upscale");
const { colorizeImage } = require("../lib/recolorDl");
const { makeSticker } = require("../lib/stickerMaker");
const { convertWithLibreOffice } = require("../lib/libreoffice");
const { convertPdfWithPython } = require("../lib/pdfConvert");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const ytdlp = require("../lib/ytdlp");
const { getMode, getFreeRamMB, totalRamGB } = require("../lib/systemSpecs");
const queryCache = require("../lib/queryCache");
const { getWeather } = require("../lib/weather");
const { searchWikipedia } = require("../lib/wikipedia");
const { getDefinition } = require("../lib/kbbi");
const { findSurah, getSurahDetail, getSurahList } = require("../lib/quran");
const { getPrayerTimes } = require("../lib/prayerTimes");
const { getVerse } = require("../lib/alkitab");
const { searchKodepos } = require("../lib/kodepos");
const { searchPinterest } = require("../lib/pinterestSearch");
const axios = require("axios");

// Helper: AI Image Generator (FLUX Pollinations AI & NaraRouter)
async function generateAiImage(prompt, options = {}) {
  const cleanPrompt = (prompt || "").trim();
  const width = options.width || 1024;
  const height = options.height || 1024;
  const style = options.style || "realistic";
  const enhancedPrompt = style && style !== "none" ? `${cleanPrompt}, ${style} style, ultra high quality, highly detailed` : cleanPrompt;

  // Jika user meminta model nara secara spesifik dan API key tersedia
  if (options.model === "nara" && (config.naraApiKey || (Array.isArray(config.naraApiKeys) && config.naraApiKeys.length))) {
    try {
      const { generateNaraImage } = require("../lib/nara");
      const buffer = await generateNaraImage(enhancedPrompt);
      if (buffer && buffer.length > 0) {
        return { buffer, provider: "nara", mimeType: "image/jpeg" };
      }
    } catch (err) {
      console.warn("[imagegen] NaraRouter gagal, beralih ke Pollinations FLUX:", err.message);
    }
  }

  // Engine Utama: FLUX / Turbo via Pollinations AI (100% Gratis, Cepat, Resolusi Tinggi)
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 1000000);
  const pollinationsModel = options.model && options.model !== "nara" ? options.model : "flux";
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${pollinationsModel}&seed=${seed}&nologo=true`;

  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HekaTools/1.0",
    },
  });

  return { buffer: Buffer.from(res.data), provider: `pollinations-${pollinationsModel}`, mimeType: "image/jpeg" };
}

const PORT = process.env.PORT || config.webPort || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/** Helper parsing request body JSON atau form data */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 25 * 1024 * 1024) {
        // limit 25MB
        req.destroy();
        reject(new Error("Ukuran request terlalu besar (maks 25MB)"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({ raw: body });
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { success: false, error: message });
}

// Handler Static Files
function serveStaticFile(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);

  // Mencegah directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback ke index.html untuk Single Page Application
      filePath = path.join(PUBLIC_DIR, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end("Internal Server Error");
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // =========================================================================
  // API ENDPOINTS
  // =========================================================================

  // 1. Status Server & Bot
  if (pathname === "/api/status" && req.method === "GET") {
    const totalMem = (os.totalmem() / 1024 ** 3).toFixed(1);
    const freeMem = (os.freemem() / 1024 ** 3).toFixed(1);
    return sendJson(res, 200, {
      success: true,
      botName: config.botName || "HekaBot",
      ownerName: config.ownerName || "Novemas Heka A",
      platform: `${os.platform()} ${os.arch()}`,
      nodeVersion: process.version,
      performanceMode: getMode(),
      ram: {
        totalGB: totalMem,
        freeGB: freeMem,
        freeMB: Math.round(getFreeRamMB()),
      },
      uptime: Math.round(process.uptime()),
    });
  }

  // 2. Daftar Alat & Warna Brat
  if (pathname === "/api/tools/info" && req.method === "GET") {
    return sendJson(res, 200, {
      success: true,
      bratColors: BRAT_COLORS,
    });
  }

  // 3. API Brat Generator
  if (pathname === "/api/tools/brat" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const text = (data.text || "").trim();
      const bgColor = data.bgColor || "#FFFFFF";

      if (!text) return sendError(res, 400, "Teks tidak boleh kosong");

      const buffer = await makeBratImageAsync(text, { bgColor });
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(buffer);
    } catch (err) {
      return sendError(res, 500, `Gagal membuat stiker Brat: ${err.message}`);
    }
  }

  // 4. API Downloader (TikTok, YouTube, dll)
  if (pathname === "/api/tools/download" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const link = (data.url || "").trim();
      const type = data.type || "video"; // video atau audio

      if (!link) return sendError(res, 400, "URL tautan video tidak boleh kosong");

      // 1. Khusus CapCut Template
      if (/capcut\.com/i.test(link)) {
        try {
          const result = await downloadCapcutTemplate(link);
          return sendJson(res, 200, {
            success: true,
            source: "capcut",
            title: result.title || "CapCut Template",
            mediaBase64: `data:video/mp4;base64,${result.buffer.toString("base64")}`,
            filename: `${result.title || "capcut_template"}.mp4`,
            mediaType: "video",
          });
        } catch (capcutErr) {
          console.warn("[web-download] CapCut gagal:", capcutErr.message);
        }
      }

      // 2. Khusus Pinterest (Foto/Video)
      if (/pinterest\.com|pin\.it/i.test(link)) {
        try {
          const result = await downloadFromPinterestLink(link);
          const isVideo = result.type === "video";
          const mime = isVideo ? "video/mp4" : "image/jpeg";
          const ext = isVideo ? "mp4" : "jpg";
          return sendJson(res, 200, {
            success: true,
            source: "pinterest",
            title: result.title || "Pinterest Media",
            mediaBase64: `data:${mime};base64,${result.buffer.toString("base64")}`,
            filename: `${result.title || "pinterest"}.${ext}`,
            mediaType: isVideo ? "video" : "image",
          });
        } catch (pinErr) {
          console.warn("[web-download] Pinterest gagal:", pinErr.message);
        }
      }

      // 3. Khusus TikTok: Coba TikWM API (cepat & tanpa watermark)
      if (/tiktok\.com/i.test(link)) {
        try {
          if (type === "audio") {
            const result = await downloadAudioViaTikwm(link);
            return sendJson(res, 200, {
              success: true,
              source: "tiktok",
              title: result.title || "TikTok Audio",
              mediaBase64: `data:audio/mp3;base64,${result.buffer.toString("base64")}`,
              filename: `${result.title || "tiktok_audio"}.mp3`,
              mediaType: "audio",
            });
          } else {
            const result = await downloadVideoViaTikwm(link);
            return sendJson(res, 200, {
              success: true,
              source: "tiktok",
              title: result.title || "TikTok Video",
              mediaBase64: `data:video/mp4;base64,${result.buffer.toString("base64")}`,
              filename: `${result.title || "tiktok_video"}.mp4`,
              mediaType: "video",
            });
          }
        } catch (tikwmErr) {
          console.warn("[web-download] TikWM gagal, mencoba yt-dlp lokal:", tikwmErr.message);
        }
      }

      // 4. Fallback umum: yt-dlp lokal (YouTube, Instagram, Facebook, dll)
      if (type === "audio") {
        const result = await ytdlp.downloadAudio(link);
        return sendJson(res, 200, {
          success: true,
          source: "ytdlp",
          title: result.title || "Audio Download",
          mediaBase64: `data:audio/mp3;base64,${result.buffer.toString("base64")}`,
          filename: `${result.title || "audio"}.mp3`,
          mediaType: "audio",
        });
      } else {
        const result = await ytdlp.downloadVideo(link);
        return sendJson(res, 200, {
          success: true,
          source: "ytdlp",
          title: result.title || "Video Download",
          mediaBase64: `data:video/mp4;base64,${result.buffer.toString("base64")}`,
          filename: `${result.title || "video"}.mp4`,
          mediaType: "video",
        });
      }
    } catch (err) {
      return sendError(res, 500, `Gagal memproses unduhan: ${err.message}`);
    }
  }

  // 5. API AI Chat & Vision Solver (Gemini / Groq)
  if (pathname === "/api/tools/ai" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const prompt = (data.prompt || "").trim();
      // Format provider: bisa "provider" saja atau "provider:model"
      // Contoh: "gemini:gemini-3.1-flash-lite", "groq:llama-3.3-70b-versatile", "deepseek:deepseek-reasoner", "mistral:codestral-latest"
      const rawProvider = (data.provider || "gemini").trim();
      const colonIdx = rawProvider.indexOf(":");
      const provider = colonIdx !== -1 ? rawProvider.slice(0, colonIdx) : rawProvider;
      const model = colonIdx !== -1 ? rawProvider.slice(colonIdx + 1) : null;
      const media = data.media; // { base64, mimeType, name, ext }

      if (!prompt && (!media || !media.base64)) {
        return sendError(res, 400, "Pesan pertanyaan atau lampiran media tidak boleh kosong");
      }

      const sessionKey = `web:${req.socket.remoteAddress || "user"}`;
      let answer;

      // Cek Query Cache (Deduplikasi untuk menghemat token API & respons instan <10ms)
      if (!media || !media.base64) {
        const cached = queryCache.get(rawProvider, prompt);
        if (cached) {
          return sendJson(res, 200, {
            success: true,
            answer: cached,
            provider: rawProvider,
            cached: true,
          });
        }
      }

      const WEB_AI_FORMAT_RULES =
        "\n\nPANDUAN FORMAT KODE, RUMUS & TEKS WAJIB:\n" +
        "1. KODE PROGRAM: Jika ada kode/perintah, WAJIB gunakan blok kode Markdown triple backticks dengan nama bahasa (contoh: ```javascript, ```python, ```html, dll). JANGAN gunakan tanda bintang (*).\n" +
        "2. RUMUS MATEMATIKA, FISIKA & SAINS: Website ini dilengkapi engine KaTeX untuk render rumus yang sangat rapi dan profesional:\n" +
        "   - Rumus Mandiri / Blok Utama: Gunakan blok display `$$ ... $$` (contoh: persamaan kuadrat, integral, matriks, pecahan besar, rumus fisika).\n" +
        "   - Rumus / Simbol di dalam Baris Kalimat: Gunakan inline `$ ... $` (contoh: $E = mc^2$, $\\det(A)$, $x \\in \\mathbb{R}$, $\\lambda$).\n" +
        "   - Matriks: SELALU gunakan format LaTeX standar seperti `\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}` atau `\\begin{bmatrix} ... \\end{bmatrix}`. JANGAN gambar matriks dengan garis pipa manual (| a b |).\n" +
        "   - Pecahan: Gunakan `\\frac{a}{b}` agar terlihat sebagai pembilang dan penyebut nyata yang rapi.\n" +
        "   - Pangkat, Akar, dan Simbol: Gunakan `x^2`, `x_i`, `\\sqrt{x}`, `\\times`, `\\pm`, `\\approx`, `\\sum`, `\\int`.\n" +
        "3. FORMAT TEKS: Gunakan **Teks Tebal** untuk bagian penting, dan daftar poin (-) atau penomoran untuk langkah-langkah penjelasan.\n" +
        "4. Berikan jawaban dalam Bahasa Indonesia yang ramah, jelas, terstruktur, dan to-the-point.";

      // Jika ada media (gambar atau dokumen yang diupload user untuk di-solve oleh AI)
      if (media && media.base64) {
        const cleanBase64 = media.base64.replace(/^data:[^;]+;base64,/, "");
        const fileBuffer = Buffer.from(cleanBase64, "base64");
        const ext = (media.ext || "").toLowerCase();
        const mimeType = media.mimeType || (ext === "pdf" ? "application/pdf" : "image/jpeg");

        const WEB_SOLVE_SYSTEM_PROMPT =
          "Kamu adalah Asisten AI Google Vision & Solver cerdas pada portal HekaTools.\n" +
          "Tugas utamamu adalah MEMERIKSA, MENYELESAIKAN, ATAU MENJELASKAN apapun yang ada di gambar/dokumen yang dikirim user.\n\n" +
          "CARA MENGERJAKAN:\n" +
          "- SOAL PELAJARAN / UJIAN (Matematika, Fisika, Kimia, Biologi, Bahasa, dll): Kerjakan secara langkah-demi-langkah dengan penjelasan yang runut, jelas, dan akurat.\n" +
          "- KODE / SCREENSHOT ERROR / TERMINAL: Analisis penyebab bug/error, jelaskan letak kesalahannya, dan berikan kode perbaikan yang lengkap dan bersih.\n" +
          "- DOKUMEN / PDF / TEKS / TABEL: Ringkas atau ekstrak informasinya sesuai instruksi user.\n" +
          "- FOTO UMUM / OBJEK: Jelaskan isi gambar secara detail dan tanggapi pertanyaan user.\n" +
          "- Jika user tidak mengetikkan instruksi khusus, secara otomatis kerjakan dan jelaskan isi gambar/dokumen ini sebaik mungkin." +
          WEB_AI_FORMAT_RULES;

        const userPrompt = prompt || "Kerjakan, selesaikan, dan jelaskan apa yang ada pada gambar/dokumen ini secara lengkap.";

        if (ext === "txt") {
          const txtContent = fileBuffer.toString("utf8").slice(0, 30000);
          answer = await askGeminiTextOneShot(`${userPrompt}\n\n=== ISI DOKUMEN ===\n${txtContent}`, WEB_SOLVE_SYSTEM_PROMPT);
        } else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
          let docPdfBuffer;
          try {
            docPdfBuffer = await convertWithLibreOffice(fileBuffer, ext, "pdf");
          } catch (e) {
            docPdfBuffer = fileBuffer;
          }
          answer = await askGeminiWithImage(userPrompt, docPdfBuffer, "application/pdf", WEB_SOLVE_SYSTEM_PROMPT);
        } else {
          // Gambar (JPG, PNG, WebP) atau PDF
          if (provider === "gemini") {
            answer = await askGeminiWithImage(userPrompt, fileBuffer, mimeType, WEB_SOLVE_SYSTEM_PROMPT, model);
          } else {
            // Gunakan engine Vision Gemini jika user memilih provider teks lain saat upload gambar
            answer = await askGeminiWithImage(userPrompt, fileBuffer, mimeType, WEB_SOLVE_SYSTEM_PROMPT);
          }
        }
      } else {
        // Obrolan Teks Standar
        const WEB_AI_SYSTEM_PROMPT =
          "Kamu adalah Asisten AI cerdas, solutif, dan ahli pemrograman pada portal web HekaTools.\n" +
          "Jawab menggunakan Bahasa Indonesia yang ramah, jelas, terstruktur rapi, dan mudah dipahami." +
          WEB_AI_FORMAT_RULES;

        if (provider === "groq") {
          answer = await askGroq(sessionKey, prompt, WEB_AI_SYSTEM_PROMPT, model);
        } else if (provider === "deepseek") {
          answer = await askDeepSeek(sessionKey, prompt, WEB_AI_SYSTEM_PROMPT, model);
        } else if (provider === "mistral" || provider === "codestral") {
          answer = await askMistral(sessionKey, prompt, WEB_AI_SYSTEM_PROMPT, model);
        } else {
          // Default Google Gemini
          answer = await askGemini(sessionKey, prompt, WEB_AI_SYSTEM_PROMPT, model);
        }

        // Simpan hasil ke cache jika respon berhasil didapatkan
        if (answer) {
          queryCache.set(rawProvider, prompt, answer);
        }
      }

      return sendJson(res, 200, {
        success: true,
        answer,
        provider: rawProvider,
      });
    } catch (err) {
      return sendError(res, 500, `AI Error: ${err.message}`);
    }
  }

  // 6. API OCR (Ekstrak Teks dari Gambar Base64)
  if (pathname === "/api/tools/ocr" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const base64Data = (data.image || "").replace(/^data:image\/\w+;base64,/, "");

      if (!base64Data) return sendError(res, 400, "Gambar base64 tidak ditemukan");

      const imageBuffer = Buffer.from(base64Data, "base64");
      const text = await recognizeText(imageBuffer);

      return sendJson(res, 200, {
        success: true,
        text: text || "Tidak ada teks yang terdeteksi dari gambar ini.",
      });
    } catch (err) {
      return sendError(res, 500, `OCR Gagal: ${err.message}`);
    }
  }

  // 7. API Cek Tagihan Listrik PLN
  if (pathname === "/api/tools/pln" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const nopel = (data.nopel || "").trim();
      if (!nopel) return sendError(res, 400, "Nomor pelanggan PLN tidak boleh kosong");

      const result = await cekTagihanPln(nopel);
      return sendJson(res, 200, {
        success: true,
        data: result,
      });
    } catch (err) {
      return sendError(res, 500, `Cek Tagihan PLN Gagal: ${err.message}`);
    }
  }

  // 8. API Hapus Latar Belakang (Remove BG AI)
  if (pathname === "/api/tools/removebg" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const base64Data = (data.image || "").replace(/^data:image\/\w+;base64,/, "");
      if (!base64Data) return sendError(res, 400, "Gambar base64 tidak ditemukan");

      const imageBuffer = Buffer.from(base64Data, "base64");
      const outBuffer = await removeBg(imageBuffer);

      return sendJson(res, 200, {
        success: true,
        image: `data:image/png;base64,${outBuffer.toString("base64")}`,
      });
    } catch (err) {
      return sendError(res, 500, `Hapus Background Gagal: ${err.message}`);
    }
  }

  // 9. API Converter Video/Audio ke MP3 atau Voice Note
  if (pathname === "/api/tools/convert" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const base64Data = (data.file || "").replace(/^data:[^;]+;base64,/, "");
      const format = data.format || "mp3"; // "mp3" atau "vn"
      const inputExt = data.ext || "mp4";

      if (!base64Data) return sendError(res, 400, "File media tidak ditemukan");

      const inputBuffer = Buffer.from(base64Data, "base64");
      let outBuffer;
      let mimeType = "audio/mp3";
      let filename = `converted_${Date.now()}.mp3`;

      if (format === "vn") {
        outBuffer = await toVoiceNote(inputBuffer, inputExt);
        mimeType = "audio/ogg";
        filename = `voicenote_${Date.now()}.ogg`;
      } else {
        outBuffer = await toMp3(inputBuffer, inputExt);
      }

      return sendJson(res, 200, {
        success: true,
        mediaBase64: `data:${mimeType};base64,${outBuffer.toString("base64")}`,
        filename,
        format,
      });
    } catch (err) {
      return sendError(res, 500, `Konversi Gagal: ${err.message}`);
    }
  }

  // 10. API Brat Video Generator (Animasi MP4)
  if (pathname === "/api/tools/bratvid" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const text = (data.text || "").trim();
      const bgColor = data.bgColor || data.color || "#FFFFFF";
      if (!text) return sendError(res, 400, "Teks tidak boleh kosong");

      const buffer = await makeBratVideo(text, { bgColor });
      const b64 = `data:video/mp4;base64,${buffer.toString("base64")}`;
      return sendJson(res, 200, {
        success: true,
        mediaBase64: b64,
        videoBase64: b64,
        filename: `bratvid_${Date.now()}.mp4`,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal membuat video Brat: ${err.message}`);
    }
  }

  // 11. API Quote Chat Maker (QC)
  if (pathname === "/api/tools/qc" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const name = (data.name || "Seseorang").trim();
      const text = (data.text || "").trim();
      let avatarBuffer = null;
      const rawAvatar = data.avatar || data.avatarBase64;
      if (rawAvatar) {
        const base64Avatar = rawAvatar.replace(/^data:image\/\w+;base64,/, "");
        avatarBuffer = Buffer.from(base64Avatar, "base64");
      }
      if (!text) return sendError(res, 400, "Teks pesan tidak boleh kosong");

      const buffer = await makeQuoteCardV2(name, text, avatarBuffer);
      const b64 = `data:image/png;base64,${buffer.toString("base64")}`;
      return sendJson(res, 200, {
        success: true,
        image: b64,
        imageBase64: b64,
        filename: `quote_${Date.now()}.png`,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal membuat quote chat: ${err.message}`);
    }
  }

  // 12. API HDR / Image Upscaler
  if (pathname === "/api/tools/hdr" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const rawImage = data.image || data.imageBase64 || "";
      const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
      const scale = Number(data.scale) || 2;
      if (!base64Data) return sendError(res, 400, "Gambar tidak ditemukan");

      const inputBuffer = Buffer.from(base64Data, "base64");
      const buffer = await upscaleImage(inputBuffer, { scale });
      const b64 = `data:image/png;base64,${buffer.toString("base64")}`;
      return sendJson(res, 200, {
        success: true,
        image: b64,
        imageBase64: b64,
        filename: `hdr_${Date.now()}.png`,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal upscale gambar: ${err.message}`);
    }
  }

  // 13. API Recolor / Colorize Foto
  if (pathname === "/api/tools/recolor" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const rawImage = data.image || data.imageBase64 || "";
      const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
      if (!base64Data) return sendError(res, 400, "Gambar tidak ditemukan");

      const inputBuffer = Buffer.from(base64Data, "base64");
      const buffer = await colorizeImage(inputBuffer);
      const b64 = `data:image/png;base64,${buffer.toString("base64")}`;
      return sendJson(res, 200, {
        success: true,
        image: b64,
        imageBase64: b64,
        filename: `recolor_${Date.now()}.png`,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal mewarnai gambar: ${err.message}`);
    }
  }

  // 14. API WhatsApp Sticker Maker (SWM)
  if (pathname === "/api/tools/sticker" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const rawImage = data.image || data.imageBase64 || "";
      const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
      const pack = (data.pack || config.botName || "HekaTools").trim();
      const author = (data.author || config.ownerName || "HekaBot").trim();
      if (!base64Data) return sendError(res, 400, "Gambar tidak ditemukan");

      const inputBuffer = Buffer.from(base64Data, "base64");
      const buffer = await makeSticker(inputBuffer, { pack, author });
      const b64 = `data:image/webp;base64,${buffer.toString("base64")}`;
      return sendJson(res, 200, {
        success: true,
        image: b64,
        stickerBase64: b64,
        mediaBase64: b64,
        filename: `sticker_${Date.now()}.webp`,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal membuat stiker: ${err.message}`);
    }
  }

  // 15. API Converter File (Universal Converter: PDF, Word, Excel, PPTX, Gambar)
  if (pathname === "/api/tools/docconvert" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const rawFile = data.file || data.fileBase64 || "";
      const base64Data = rawFile.replace(/^data:[^;]+;base64,/, "");
      const originalFilename = data.filename || "dokumen";
      const fromType = (data.fromType || data.fromFormat || "word").toLowerCase(); // pdf, word, excel, pptx, gambar
      const toType = (data.toType || data.toFormat || data.targetFormat || "pdf").toLowerCase(); // pdf, word, excel, pptx, gambar

      if (!base64Data) return sendError(res, 400, "File dokumen tidak ditemukan");
      if (fromType === toType) return sendError(res, 400, "Format asal dan tujuan sama. Pilih format yang berbeda.");

      const inputBuffer = Buffer.from(base64Data, "base64");
      const baseName = path.basename(originalFilename, path.extname(originalFilename)) || "dokumen";
      let inputExt = (path.extname(originalFilename).slice(1) || "").toLowerCase();

      if (!inputExt) {
        if (fromType === "pdf") inputExt = "pdf";
        else if (fromType === "word") inputExt = "docx";
        else if (fromType === "excel") inputExt = "xlsx";
        else if (fromType === "pptx") inputExt = "pptx";
        else if (fromType === "gambar") inputExt = "png";
      }

      let outBuffer;
      let outExt = "pdf";
      let outMime = "application/pdf";

      // Kasus 1: Tujuan adalah PDF
      if (toType === "pdf") {
        if (fromType === "gambar" || ["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(inputExt)) {
          let pngOrJpgBuf = inputBuffer;
          if (["webp", "bmp", "gif"].includes(inputExt)) {
            pngOrJpgBuf = await sharp(inputBuffer).png().toBuffer();
          }
          const pdfDoc = await PDFDocument.create();
          const isJpg = inputExt === "jpg" || inputExt === "jpeg" || (pngOrJpgBuf[0] === 0xff && pngOrJpgBuf[1] === 0xd8);
          const img = isJpg ? await pdfDoc.embedJpg(pngOrJpgBuf) : await pdfDoc.embedPng(pngOrJpgBuf);
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          outBuffer = Buffer.from(await pdfDoc.save());
        } else {
          outBuffer = await convertWithLibreOffice(inputBuffer, inputExt, "pdf");
        }
        outExt = "pdf";
        outMime = "application/pdf";
      }
      // Kasus 2: Tujuan adalah Word (DOCX)
      else if (toType === "word") {
        let pdfBuf = inputBuffer;
        if (fromType !== "pdf") {
          if (fromType === "gambar") {
            const pdfDoc = await PDFDocument.create();
            const img = (inputExt === "jpg" || inputExt === "jpeg") ? await pdfDoc.embedJpg(inputBuffer) : await pdfDoc.embedPng(inputBuffer);
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            pdfBuf = Buffer.from(await pdfDoc.save());
          } else {
            pdfBuf = await convertWithLibreOffice(inputBuffer, inputExt, "pdf");
          }
        }
        outBuffer = await convertPdfWithPython(pdfBuf, "pdf_to_docx.py", "docx");
        outExt = "docx";
        outMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      // Kasus 3: Tujuan adalah Excel (XLSX)
      else if (toType === "excel") {
        let pdfBuf = inputBuffer;
        if (fromType !== "pdf") {
          pdfBuf = await convertWithLibreOffice(inputBuffer, inputExt, "pdf");
        }
        outBuffer = await convertPdfWithPython(pdfBuf, "pdf_to_xlsx.py", "xlsx");
        outExt = "xlsx";
        outMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }
      // Kasus 4: Tujuan adalah PPTX
      else if (toType === "pptx") {
        let pdfBuf = inputBuffer;
        if (fromType !== "pdf") {
          if (fromType === "gambar") {
            const pdfDoc = await PDFDocument.create();
            const img = (inputExt === "jpg" || inputExt === "jpeg") ? await pdfDoc.embedJpg(inputBuffer) : await pdfDoc.embedPng(inputBuffer);
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            pdfBuf = Buffer.from(await pdfDoc.save());
          } else {
            pdfBuf = await convertWithLibreOffice(inputBuffer, inputExt, "pdf");
          }
        }
        outBuffer = await convertPdfWithPython(pdfBuf, "pdf_to_pptx.py", "pptx");
        outExt = "pptx";
        outMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      }
      // Kasus 5: Tujuan adalah Gambar (PNG)
      else if (toType === "gambar") {
        if (fromType === "gambar") {
          outBuffer = await sharp(inputBuffer).png().toBuffer();
        } else {
          let pdfBuf = inputBuffer;
          if (fromType !== "pdf") {
            pdfBuf = await convertWithLibreOffice(inputBuffer, inputExt, "pdf");
          }
          outBuffer = await convertPdfWithPython(pdfBuf, "pdf_to_image.py", "png");
        }
        outExt = "png";
        outMime = "image/png";
      }

      const outFilename = `${baseName}_converted.${outExt}`;
      return sendJson(res, 200, {
        success: true,
        fileBase64: `data:${outMime};base64,${outBuffer.toString("base64")}`,
        filename: outFilename,
        format: outExt,
        size: outBuffer.length,
      });
    } catch (err) {
      console.error("DocConvert Error:", err);
      return sendError(res, 500, `Konversi Dokumen Gagal: ${err.message}`);
    }
  }

  // 16. API Cek Cuaca (BMKG / Open-Meteo)
  if (pathname === "/api/tools/weather" && req.method === "GET") {
    try {
      const q = parsedUrl.query.q || "Jakarta";
      const weatherData = await getWeather(q);
      if (!weatherData) return sendError(res, 404, `Data cuaca untuk kota "${q}" tidak ditemukan`);
      return sendJson(res, 200, { success: true, data: weatherData });
    } catch (err) {
      return sendError(res, 500, `Gagal mengambil data cuaca: ${err.message}`);
    }
  }

  // 17. API Wikipedia Ringkasan Ensiklopedia
  if (pathname === "/api/tools/wikipedia" && req.method === "GET") {
    try {
      const q = parsedUrl.query.q;
      if (!q) return sendError(res, 400, "Parameter pencarian q tidak boleh kosong");
      const wikiData = await searchWikipedia(q);
      if (!wikiData) return sendError(res, 404, `Artikel Wikipedia untuk "${q}" tidak ditemukan`);
      return sendJson(res, 200, { success: true, data: wikiData });
    } catch (err) {
      return sendError(res, 500, `Gagal mencari Wikipedia: ${err.message}`);
    }
  }

  // 18. API KBBI (Kamus Besar Bahasa Indonesia)
  if (pathname === "/api/tools/kbbi" && req.method === "GET") {
    try {
      const q = parsedUrl.query.q;
      if (!q) return sendError(res, 400, "Parameter kata q tidak boleh kosong");
      const def = await getDefinition(q);
      if (!def) return sendError(res, 404, `Definisi kata "${q}" tidak ditemukan di KBBI`);
      return sendJson(res, 200, { success: true, word: q, definition: def });
    } catch (err) {
      return sendError(res, 500, `Gagal mencari definisi KBBI: ${err.message}`);
    }
  }

  // 19. API AI Image Generator (Text-to-Image via FLUX / Nara)
  if (pathname === "/api/tools/imagegen" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const prompt = (data.prompt || "").trim();
      if (!prompt) return sendError(res, 400, "Deskripsi prompt gambar tidak boleh kosong");

      const width = parseInt(data.width, 10) || 1024;
      const height = parseInt(data.height, 10) || 1024;
      const style = data.style || "realistic";
      const model = data.model || "flux";

      const result = await generateAiImage(prompt, { width, height, style, model });
      return sendJson(res, 200, {
        success: true,
        imageBase64: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
        provider: result.provider,
        prompt,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal generate gambar: ${err.message}`);
    }
  }

  // 20. API Text-to-Speech (TTS Audio MP3)
  if (pathname === "/api/tools/tts" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const text = (data.text || "").trim();
      const lang = data.lang || "id";
      if (!text) return sendError(res, 400, "Teks untuk diubah menjadi suara tidak boleh kosong");

      // Batasi 300 karakter per request TTS
      const safeText = text.slice(0, 300);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(safeText)}`;

      const audioRes = await axios.get(ttsUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        responseType: "arraybuffer",
        timeout: 15000,
      });

      const audioBase64 = Buffer.from(audioRes.data).toString("base64");
      return sendJson(res, 200, {
        success: true,
        audioBase64: `data:audio/mp3;base64,${audioBase64}`,
        lang,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal membuat audio TTS: ${err.message}`);
    }
  }

  // 21. API Shortlink Generator
  if (pathname === "/api/tools/shortlink" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const longUrl = (data.url || "").trim();
      if (!longUrl) return sendError(res, 400, "URL tidak boleh kosong");
      if (!/^https?:\/\//i.test(longUrl)) {
        return sendError(res, 400, "URL harus diawali dengan http:// atau https://");
      }

      let shortUrl = "";
      // Coba da.gd dulu
      try {
        const daRes = await axios.get(`https://da.gd/s?url=${encodeURIComponent(longUrl)}`, { timeout: 10000 });
        if (daRes.data && typeof daRes.data === "string" && daRes.data.trim().startsWith("http")) {
          shortUrl = daRes.data.trim();
        }
      } catch (e) {
        // Fallback TinyURL
      }

      if (!shortUrl) {
        const tinyRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, { timeout: 10000 });
        if (tinyRes.data && typeof tinyRes.data === "string" && tinyRes.data.trim().startsWith("http")) {
          shortUrl = tinyRes.data.trim();
        }
      }

      if (!shortUrl) {
        return sendError(res, 500, "Layanan pemendek tautan sedang sibuk, silakan coba beberapa saat lagi");
      }

      return sendJson(res, 200, {
        success: true,
        originalUrl: longUrl,
        shortUrl,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal memendekkan URL: ${err.message}`);
    }
  }

  // 22. API QR Code Generator
  if (pathname === "/api/tools/qr" && req.method === "POST") {
    try {
      const data = await parseRequestBody(req);
      const text = (data.text || "").trim();
      if (!text) return sendError(res, 400, "Konten teks atau tautan QR code tidak boleh kosong");

      const size = data.size || "350x350";
      const color = (data.color || "000000").replace("#", "");
      const bgcolor = (data.bgcolor || "ffffff").replace("#", "");

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}&color=${color}&bgcolor=${bgcolor}&margin=10`;

      const qrRes = await axios.get(qrUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      });

      const base64Data = Buffer.from(qrRes.data).toString("base64");
      return sendJson(res, 200, {
        success: true,
        imageBase64: `data:image/png;base64,${base64Data}`,
        qrUrl,
      });
    } catch (err) {
      return sendError(res, 500, `Gagal membuat QR Code: ${err.message}`);
    }
  }

  // 23. API Al-Qur'an (Daftar 114 Surat)
  if (pathname === "/api/tools/quran/surahs" && req.method === "GET") {
    try {
      const list = await getSurahList();
      return sendJson(res, 200, { success: true, data: list });
    } catch (err) {
      return sendError(res, 500, `Gagal memuat daftar surat Al-Qur'an: ${err.message}`);
    }
  }

  // 24. API Al-Qur'an (Detail Surat & Ayat)
  if (pathname === "/api/tools/quran/detail" && req.method === "GET") {
    try {
      const surahParam = parsedUrl.query.surah;
      if (!surahParam) return sendError(res, 400, "Parameter surah tidak boleh kosong");

      let targetNumber = parseInt(surahParam, 10);
      if (isNaN(targetNumber)) {
        const found = await findSurah(surahParam);
        if (!found) return sendError(res, 404, `Surat "${surahParam}" tidak ditemukan`);
        targetNumber = found.nomor;
      }

      const detail = await getSurahDetail(targetNumber);
      if (!detail) return sendError(res, 404, `Detail surat nomor ${targetNumber} tidak ditemukan`);

      return sendJson(res, 200, { success: true, data: detail });
    } catch (err) {
      return sendError(res, 500, `Gagal memuat ayat Al-Qur'an: ${err.message}`);
    }
  }

  // 25. API Jadwal Sholat & Waktu Imsakiyah
  if (pathname === "/api/tools/prayer" && req.method === "GET") {
    try {
      const city = parsedUrl.query.city || "Jakarta";
      const timings = await getPrayerTimes(city);
      if (!timings) return sendError(res, 404, `Jadwal sholat untuk kota "${city}" tidak ditemukan`);

      return sendJson(res, 200, { success: true, data: timings });
    } catch (err) {
      return sendError(res, 500, `Gagal memuat jadwal sholat: ${err.message}`);
    }
  }

  // 26. API Alkitab Digital (Pencarian Ayat)
  if (pathname === "/api/tools/alkitab" && req.method === "GET") {
    try {
      const passage = parsedUrl.query.passage;
      if (!passage) return sendError(res, 400, "Parameter passage referensi ayat tidak boleh kosong");

      const verses = await getVerse(passage);
      if (!verses || verses.length === 0) {
        return sendError(res, 404, `Ayat Alkitab untuk "${passage}" tidak ditemukan`);
      }

      return sendJson(res, 200, { success: true, passage, data: verses });
    } catch (err) {
      return sendError(res, 500, `Gagal mengambil ayat Alkitab: ${err.message}`);
    }
  }

  // 27. API Pencarian Kode Pos Indonesia
  if (pathname === "/api/tools/kodepos" && req.method === "GET") {
    try {
      const q = parsedUrl.query.q;
      if (!q) return sendError(res, 400, "Parameter pencarian q tidak boleh kosong");

      const results = await searchKodepos(q);
      return sendJson(res, 200, { success: true, query: q, data: results });
    } catch (err) {
      return sendError(res, 500, `Gagal mencari kode pos: ${err.message}`);
    }
  }

  // 28. API Pencarian Lirik Lagu
  if (pathname === "/api/tools/lyrics" && req.method === "GET") {
    try {
      const artist = parsedUrl.query.artist || "";
      const title = parsedUrl.query.title || "";
      const q = parsedUrl.query.q || "";

      let finalArtist = artist.trim();
      let finalTitle = title.trim();

      if (!finalArtist && !finalTitle && q) {
        if (q.includes("-")) {
          const parts = q.split("-");
          finalArtist = parts[0].trim();
          finalTitle = parts.slice(1).join("-").trim();
        } else {
          finalTitle = q.trim();
          finalArtist = "Various Artists";
        }
      }

      if (!finalTitle) return sendError(res, 400, "Judul lagu tidak boleh kosong");

      const resLyrics = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(finalArtist)}/${encodeURIComponent(finalTitle)}`,
        { timeout: 20000 }
      );
      const lyrics = resLyrics.data?.lyrics;
      if (!lyrics) return sendError(res, 404, `Lirik lagu untuk "${finalArtist} - ${finalTitle}" tidak ditemukan`);

      return sendJson(res, 200, {
        success: true,
        artist: finalArtist,
        title: finalTitle,
        lyrics: lyrics.trim(),
      });
    } catch (err) {
      return sendError(res, 500, `Lirik lagu tidak ditemukan atau terjadi kesalahan server`);
    }
  }

  // 29. API Pencarian Foto Pinterest HD
  if (pathname === "/api/tools/pinterest/search" && req.method === "GET") {
    try {
      const q = parsedUrl.query.q;
      if (!q) return sendError(res, 400, "Kata kunci pencarian foto q tidak boleh kosong");

      const pins = await searchPinterest(q);
      return sendJson(res, 200, { success: true, query: q, data: (pins || []).slice(0, 20) });
    } catch (err) {
      return sendError(res, 500, `Gagal mencari foto di Pinterest: ${err.message}`);
    }
  }

  // Layani Static Files (Frontend UI)
  return serveStaticFile(req, res, pathname);
});

function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`\n🚀 [HekaTools Web] Server aktif dan berjalan di:`);
      console.log(`   👉 Lokal: http://localhost:${port}`);
      console.log(`   👉 Jaringan/WiFi: http://[IP-Lokal-Anda]:${port}\n`);
      resolve(server);
    });
  });
}

// Jika dijalankan langsung (node web/server.js)
if (require.main === module) {
  startServer().catch((err) => {
    console.error("Gagal menjalankan server:", err);
  });
}

module.exports = { startServer, server };
