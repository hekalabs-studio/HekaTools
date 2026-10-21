const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { resolveBinary, BIN_DIR } = require("./binaries");
const { spawnWithTimeout } = require("./spawnWithTimeout");
const { isLowSpec } = require("./systemSpecs");

const TMP_DIR = path.join(__dirname, "..", "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ==== BATAS UKURAN FILE (safety net RAM/disk) ====
// downloadVideo/downloadAudio nge-buffer SELURUH file hasil download ke RAM
// (fs.readFileSync) sebelum dikirim ke WhatsApp -- tanpa batas, link ke video yang
// sangat panjang/resolusi tinggi bisa bikin RAM/disk device membengkak gak kekontrol,
// apalagi kalau beberapa user minta bareng-bareng. "--max-filesize" bikin yt-dlp
// BERHENTI dari awal (sebelum download kelar) begitu ukurannya udah kelewat batas,
// jadi gagalnya cepat & jelas -- bukan nunggu download penuh dulu baru ketahuan berat.
// WhatsApp sendiri juga punya batas ukuran kirim media (video/audio ~sekitar 100MB via
// Baileys), jadi angka ini juga sekalian nyaring file yang kemungkinan gagal terkirim.
const MAX_FILESIZE = "100M";

// ==== COOKIES (buat Instagram/TikTok yang sekarang WAJIB login di banyak kasus) ====
// Sejak ~2025, Instagram (dan kadang TikTok) makin sering nolak request TANPA cookies -- bukan
// cuma buat konten private, tapi post/reels PUBLIK juga kena, errornya "No video formats
// found!" atau "Instagram sent an empty media response". Ini dikonfirmasi developer yt-dlp
// sendiri di halaman KNOWN ISSUES resmi mereka (github.com/yt-dlp/yt-dlp/issues/17074) --
// jadi ini BUKAN soal yt-dlp ketinggalan versi, update sebanyak apapun gak bakal nolong kalau
// penyebabnya ini. Satu-satunya fix yang didukung resmi: kasih cookies dari akun yang login.
//
// Taruh file cookies (format Netscape, hasil export dari browser yang login) di
// `data/cookies.txt` -- kalau file ini ada, otomatis dipakai buat SEMUA request yt-dlp (gak
// perlu pilih per-platform, satu file cookies.txt bisa isi cookies dari banyak domain sekaligus
// asal export-nya pas lagi login ke semua platform yang mau dipakai di browser yang sama).
// Cara export & detail lengkap ada di README.md.
const COOKIES_FILE = path.join(__dirname, "..", "data", "cookies.txt");

// 5 menit per percobaan -- yt-dlp sendiri punya retry logic (lihat RETRY_DELAYS_MS di bawah),
// jadi timeout di sini cuma jaga-jaga kalau proses-nya BENERAN macet (bukan cuma lambat karena
// internet lelet/server sumbernya lambat -- itu udah wajar butuh waktu, coba amati durasi
// ttmp4/ytmp4 yang berhasil di log kamu sebelumnya bisa 30-60 detik, itu normal).
const YTDLP_TIMEOUT_MS = 5 * 60 * 1000;

function runOnce(args) {
  return new Promise((resolve, reject) => {
    const bin = resolveBinary("yt-dlp");

    // Kalau ffmpeg.exe ada di folder bin/ lokal, kasih tahu yt-dlp lokasinya secara eksplisit
    // (yt-dlp butuh ffmpeg buat convert ke mp3/dsb)
    const localFfmpeg = process.platform === "win32" ? path.join(BIN_DIR, "ffmpeg.exe") : path.join(BIN_DIR, "ffmpeg");
    let finalArgs = fs.existsSync(localFfmpeg) ? ["--ffmpeg-location", BIN_DIR, ...args] : args;
    if (fs.existsSync(COOKIES_FILE)) finalArgs = ["--cookies", COOKIES_FILE, ...finalArgs];


    const { proc, isTimedOut } = spawnWithTimeout(bin, finalArgs, { timeoutMs: YTDLP_TIMEOUT_MS });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => {
      reject(
        new Error(
          "yt-dlp tidak ditemukan. Salah satu cara ini:\n" +
          "1) pip install yt-dlp (lalu BUKA ULANG terminal), atau\n" +
          "2) Download yt-dlp.exe dari https://github.com/yt-dlp/yt-dlp/releases/latest, " +
          "taruh di folder `bin/yt-dlp.exe` di dalam project ini\n" +
          "Detail: " + err.message
        )
      );
    });
    proc.on("close", (code) => {
      if (isTimedOut()) {
        // Sengaja BUKAN ditandain "transient" (gak di-retry otomatis) -- kalau proses ini aja
        // udah butuh 5 menit dan masih macet, kemungkinan besar retry langsung juga bakal
        // macet lagi (total waktu tunggu bisa sampai puluhan menit kalau tetap dipaksa retry).
        return reject(new Error(`yt-dlp kelamaan/macet (lebih dari ${YTDLP_TIMEOUT_MS / 1000 / 60} menit), proses dipaksa berhenti. Coba lagi beberapa saat lagi.`));
      }
      if (code === 0) return resolve(stdout);
      const fullOutput = stderr || stdout; // dipakai buat DETEKSI pola (jangan sampai kepotong)
      const errOutput = fullOutput.slice(-500); // dipakai buat DITAMPILKAN ke user (biar gak kepanjangan)
      if (/max-filesize|File is larger than max-filesize/i.test(fullOutput)) {
        reject(
          new Error(
            `File-nya lebih gede dari batas maksimal (${MAX_FILESIZE}) yang diizinkan bot ini -- ` +
            "sengaja dibatasi biar RAM/disk device gak kewalahan pas download file besar. " +
            "Coba link/video lain yang lebih pendek/resolusinya lebih kecil."
          )
        );
        return;
      }
      const err = new Error("yt-dlp gagal: " + errOutput + buildUpdateHint(fullOutput));
      err.rawOutput = fullOutput; // dipakai retry logic di run() buat cek pola transient -- FULL output, jangan kepotong
      reject(err);
    });
  });
}

// Pola error yang keliatannya cuma GANGGUAN SESAAT (rate-limit/anti-bot TikTok/IG yang lagi
// ketat), BUKAN masalah permanen -- dibuktikan dari laporan nyata: link YANG SAMA gagal 2x
// dengan pesan ini, terus BERHASIL di percobaan ke-3 tanpa ada yang diubah sama sekali (yt-dlp
// gak di-update, link gak diganti). Beda sama misal "Requested format is not available" yang
// sifatnya lebih pasti/struktural (link itu emang gak punya format yang diminta -- diulang pun
// hasilnya bakal sama, gak ada gunanya retry).
const TRANSIENT_SIGNS = [
  "Unable to extract universal data for rehydration",
  "Unable to extract yt initial data",
  "unable to download video data: HTTP Error 403",
  "Sign in to confirm",
  "HTTP Error 429",
  "Read timed out",
  "Connection reset",
];

const RETRY_DELAYS_MS = [3000, 6000, 10000]; // nyoba ulang 3x (total 4x percobaan), jeda makin lama tiap kali (backoff)

/**
 * Sama kayak runOnce(), tapi kalau errornya kelihatan TRANSIENT (lihat TRANSIENT_SIGNS di
 * atas), otomatis dicoba ulang sampai 2x sebelum beneran nyerah -- biar user gak perlu
 * ngetik ulang command manual pas TikTok/IG lagi rewel sesaat.
 */
let lowSpecQueue = Promise.resolve();

/**
 * Eksekusi yt-dlp. Pada mode LOW, antrekan proses agar hanya 1 child process yt-dlp berjalan
 * bersamaan untuk mencegah 100% CPU lockup dan saturasi HDD 5400RPM.
 */
async function run(args) {
  if (isLowSpec()) {
    const execute = () => runInternal(args);
    const p = lowSpecQueue.then(execute, execute);
    lowSpecQueue = p.catch(() => {});
    return p;
  }
  return runInternal(args);
}

async function runInternal(args) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await runOnce(args);
    } catch (err) {
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length;
      const looksTransient = err.rawOutput && TRANSIENT_SIGNS.some((sign) => err.rawOutput.includes(sign));
      if (isLastAttempt || !looksTransient) throw err;

      const delay = RETRY_DELAYS_MS[attempt];
      console.log(`[ytdlp] Kelihatan gangguan sesaat (percobaan ${attempt + 1} gagal) -- nyoba ulang dalam ${delay / 1000} detik...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Pola error yang KHUSUS berarti platform-nya (Instagram terutama, kadang TikTok/Facebook)
// sekarang WAJIB login buat request itu -- dikonfirmasi resmi di halaman KNOWN ISSUES yt-dlp
// (github.com/yt-dlp/yt-dlp/issues/17074): sejak ~2025 ini kejadian bahkan buat POST PUBLIK,
// bukan cuma konten private. SENGAJA dipisah dari OUTDATED_SIGNS di bawah -- update yt-dlp gak
// akan nolong buat kasus ini (banyak laporan orang udah pakai versi nightly/master terbaru
// tetap kena), yang dibutuhkan itu file cookies (lihat COOKIES_FILE di atas & README.md).
const NEEDS_COOKIES_SIGNS = [
  "No video formats found",
  "Instagram sent an empty media response",
  "login required",
  "Requested content is not available, rate-limit reached or login required",
];

// Beberapa pesan error yt-dlp ini biasanya artinya binary yt-dlp yang kepasang ketinggalan
// versi (situs kayak TikTok/YouTube sering ubah struktur, dan yt-dlp baru rilis patch-nya
// hampir tiap minggu) -- bukan bug di bot. Kasih hint update biar user gak bingung.
const OUTDATED_SIGNS = [
  "Unable to extract universal data for rehydration",
  "Unable to extract yt initial data",
  "unable to download video data: HTTP Error 403",
  "Requested format is not available",
  "Sign in to confirm",
];

// Domain platform yang SEHARUSNYA didukung yt-dlp (bukan situs random di luar cakupannya).
// Dipakai buat mbedain "Unsupported URL" karena yt-dlp beneran ketinggalan versi (URL pattern
// baru kayak TikTok /photo/... buat slideshow belum dikenali versi lama) VS "Unsupported URL"
// karena user emang ngasih link dari situs yang emang gak pernah didukung yt-dlp sama sekali.
const KNOWN_PLATFORM_DOMAINS = [
  "tiktok.com", "instagram.com", "facebook.com", "fb.watch",
  "twitter.com", "x.com", "pinterest.com", "threads.net",
];

function buildUpdateHint(errOutput) {
  const needsCookies = NEEDS_COOKIES_SIGNS.some((sign) => errOutput.includes(sign));
  if (needsCookies) {
    const cookiesAlreadySet = fs.existsSync(COOKIES_FILE);
    return (
      "\n\n💡 Ini BUKAN soal yt-dlp ketinggalan versi -- ini Instagram/TikTok/Facebook yang " +
      "sekarang WAJIB login buat request kayak gini (dikonfirmasi resmi di halaman KNOWN ISSUES " +
      "yt-dlp, kejadian bahkan buat post PUBLIK, bukan cuma konten private). Update yt-dlp " +
      "sebanyak apapun (termasuk versi nightly/master terbaru) TIDAK akan nolong kasus ini.\n" +
      (cookiesAlreadySet
        ? "File cookies (`data/cookies.txt`) udah ke-detect ada, tapi tetap gagal -- kemungkinan " +
          "cookies-nya udah kadaluarsa (session Instagram/TikTok logout otomatis setelah " +
          "beberapa waktu). Export ulang cookies-nya dari browser yang lagi login."
        : "Fix-nya: siapin file cookies (`data/cookies.txt`, format Netscape) dari akun yang " +
          "login di platform itu. Cara lengkap export cookies-nya ada di README.md bagian " +
          "\"Instagram/TikTok minta login (No video formats found)\".")
    );
  }

  const looksOutdated = OUTDATED_SIGNS.some((sign) => errOutput.includes(sign));
  const isUnsupportedUrlOnKnownPlatform =
    errOutput.includes("Unsupported URL") && KNOWN_PLATFORM_DOMAINS.some((d) => errOutput.includes(d));

  if (!looksOutdated && !isUnsupportedUrlOnKnownPlatform) return "";

  const extraNote = isUnsupportedUrlOnKnownPlatform
    ? "\n(Ini sering kejadian khusus buat link TikTok /photo/... [slideshow] atau carousel Instagram " +
      "baru -- yt-dlp versi lama belum kenal pola URL itu, tapi versi terbaru biasanya udah support.)"
    : "";

  return (
    "\n\n💡 Bot udah otomatis coba ulang beberapa kali sebelum nyerah, tapi tetap gagal. Error di atas " +
    "biasanya karena salah satu dari dua hal:\n" +
    "1) yt-dlp yang kepasang ketinggalan versi (TikTok/YouTube sering ubah struktur situsnya), atau\n" +
    "2) platform-nya (TikTok/Instagram/dst) lagi rate-limit/anti-bot ketat sesaat -- coba lagi " +
    "beberapa menit lagi kalau yt-dlp kamu udah paling baru." + extraNote + "\n" +
    "Cara update yt-dlp (buat kemungkinan #1):\n" +
    "- Kalau install via pip: `pip install -U yt-dlp`\n" +
    "- Kalau pakai yt-dlp.exe di folder bin/: download ulang versi terbaru dari " +
    "https://github.com/yt-dlp/yt-dlp/releases/latest"
  );
}

// Paksa yt-dlp pura-pura jadi client Android buat request YouTube -- workaround umum yang
// dipakai komunitas yt-dlp buat ngurangin error "HTTP Error 403: Forbidden" pas YouTube lagi
// ketat-ketatnya soal signature/PO token. Aman dipasang selalu karena namespace-nya "youtube:"
// jadi cuma kepake pas target-nya emang YouTube, di URL lain diabaikan yt-dlp.
const YOUTUBE_ARGS = ["--extractor-args", "youtube:player_client=android,web"];

/** Ambil metadata video/hasil pencarian YouTube tanpa download */
async function getInfo(urlOrQuery) {
  const target = urlOrQuery.startsWith("http") ? urlOrQuery : `ytsearch1:${urlOrQuery}`;
  const out = await run(["--dump-json", "--no-playlist", "--no-warnings", ...YOUTUBE_ARGS, target]);
  const firstLine = out.trim().split("\n")[0];
  return JSON.parse(firstLine);
}

/**
 * Baca file `<id>.info.json` yang ditulis yt-dlp lewat flag `--write-info-json` (dipasang di
 * downloadAudio/downloadVideo/downloadImages di bawah), ambil title-nya, terus file json-nya
 * langsung dihapus (cuma dipakai sesaat, gak perlu nyampah di tmp/).
 *
 * SEBELUMNYA: downloadAudio/downloadVideo/downloadImages masing-masing manggil getInfo() abis
 * download beres -- itu artinya yt-dlp DIJALANIN DUA KALI per 1x download (sekali buat
 * download beneran, sekali lagi CUMA buat ambil title). Ini mahal banget: hampir 2x lipat waktu
 * tunggu user (yt-dlp sendiri yang paling makan waktu, bukan proses bot-nya), 2x lipat request
 * ke platform sumber (makin rawan kena rate-limit/anti-bot TikTok/Instagram -- lihat catatan
 * TRANSIENT_SIGNS/NEEDS_COOKIES_SIGNS di atas, itu emang udah jadi masalah nyata), dan 2x lipat
 * proses spawn yang numpuk CPU/RAM kalau lagi banyak user download bareng. Title itu sendiri
 * sebenarnya SUDAH dikirim yt-dlp ke disk otomatis kalau dikasih --write-info-json pas proses
 * download yang sama -- jadi baca file lokal ini jauh lebih murah/cepat daripada nembak ulang
 * request ke internet.
 */
function readTitleFromInfoJson(infoJsonPath, fallback) {
  try {
    const info = JSON.parse(fs.readFileSync(infoJsonPath, "utf8"));
    return info.title || info.fulltitle || fallback;
  } catch {
    return fallback;
  } finally {
    fs.rmSync(infoJsonPath, { force: true });
  }
}

/** Download audio (mp3) dari URL/judul YouTube, return { buffer, title } */
async function downloadAudio(urlOrQuery) {
  const target = urlOrQuery.startsWith("http") ? urlOrQuery : `ytsearch1:${urlOrQuery}`;
  const id = crypto.randomBytes(6).toString("hex");
  const outputTemplate = path.join(TMP_DIR, `${id}.%(ext)s`);

  const audioQuality = isLowSpec() ? "6" : "5";
  const maxAudioFilesize = isLowSpec() ? "25M" : MAX_FILESIZE;

  await run([
    "-x", "--audio-format", "mp3", "--audio-quality", audioQuality,
    "--no-playlist", "--no-warnings",
    "--max-filesize", maxAudioFilesize,
    "--write-info-json", // biar title-nya bisa dibaca dari disk, gak perlu run yt-dlp kedua kalinya
    ...YOUTUBE_ARGS,
    "-o", outputTemplate,
    target,
  ]);

  const finalFile = path.join(TMP_DIR, `${id}.mp3`);
  if (!fs.existsSync(finalFile)) throw new Error("File hasil download tidak ditemukan.");

  const title = readTitleFromInfoJson(path.join(TMP_DIR, `${id}.info.json`), "audio");
  const buffer = fs.readFileSync(finalFile);
  fs.rmSync(finalFile, { force: true });
  return { buffer, title };
}

/** Download video (mp4) dari URL YouTube, return { buffer, title } */
async function downloadVideo(url) {
  const id = crypto.randomBytes(6).toString("hex");
  const outputTemplate = path.join(TMP_DIR, `${id}.%(ext)s`);

  // === Preferensi codec H.264 (avc1) buat kompatibilitas HP ===
  // SEBELUMNYA cuma "best[ext=mp4]/best" -- ambil kualitas TERTINGGI apa adanya tanpa peduli
  // codec-nya. Masalahnya: sebagian video (terutama resolusi tinggi) di-encode pakai H.265/HEVC
  // atau profile H.264 yang berat, dan gak semua HP (terutama yang lebih tua/spek rendah) punya
  // hardware decoder yang sanggup mutar itu -- WhatsApp nolak muter dengan pesan "ada masalah
  // dengan file video", padahal file-nya sendiri gak rusak. H.264 (avc1) adalah codec paling
  // UNIVERSAL didukung hampir semua HP dari jaman baheula sampai sekarang, jadi diprioritaskan
  // duluan kalau tersedia -- baru fallback ke "apa aja yang penting mp4"/"apa aja yang ada" kalau
  // sumbernya emang cuma nyediain codec lain.
  const videoFormat = isLowSpec()
    ? "best[height<=480][vcodec^=avc1][ext=mp4]/best[height<=480][ext=mp4]/best[height<=720][ext=mp4]/best[ext=mp4]/best"
    : "best[vcodec^=avc1][ext=mp4]/best[ext=mp4]/best";
  const maxVideoFilesize = isLowSpec() ? "30M" : MAX_FILESIZE;

  await run([
    "-f", videoFormat,
    "--no-playlist", "--no-warnings",
    "--max-filesize", maxVideoFilesize,
    "--write-info-json", // biar title-nya bisa dibaca dari disk, gak perlu run yt-dlp kedua kalinya
    ...YOUTUBE_ARGS,
    "-o", outputTemplate,
    url,
  ]);

  // PENTING: sekarang ada 2 file yang namanya sama-sama mulai dengan `${id}` di TMP_DIR --
  // file video aslinya DAN `${id}.info.json` (baru, dari --write-info-json di atas). Filter
  // .info.json keluar dulu sebelum ambil "file video"-nya, kalau enggak bisa ke-mismatch
  // (info.json malah ke-anggep sebagai file videonya kalau kebetulan dia yang urutan pertama).
  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(id) && !f.endsWith(".info.json"));
  if (!files.length) throw new Error("File hasil download tidak ditemukan.");
  const finalFile = path.join(TMP_DIR, files[0]);

  const title = readTitleFromInfoJson(path.join(TMP_DIR, `${id}.info.json`), "video");
  const buffer = fs.readFileSync(finalFile);
  fs.rmSync(finalFile, { force: true });
  return { buffer, title };
}

// Ekstensi gambar yang dianggap "slide" hasil download carousel/slideshow (Instagram carousel,
// TikTok photo mode/slideshow). Bukan .mp3/.mp4 -- itu biasanya musik latar slideshow-nya, bukan
// slide-nya sendiri, jadi sengaja gak ikut dikirim.
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Download semua GAMBAR (slide) dari sebuah post carousel Instagram atau slideshow/photo-mode
 * TikTok, return { buffers: Buffer[], title }.
 *
 * Beda dari downloadVideo/downloadAudio: sengaja TIDAK pakai `--no-playlist` di sini, karena
 * carousel/slideshow itu sendiri "dianggap" playlist oleh yt-dlp (tiap foto = 1 entry) -- kalau
 * pakai --no-playlist, cuma foto pertama yang kedownload. Juga sengaja gak pakai `-f` (format
 * selector) karena itu cuma berlaku buat video; kalau dipaksa (mis. "best[ext=mp4]/best") malah
 * bikin gagal total di post yang isinya gambar semua (gak ada format video sama sekali).
 */
async function downloadImages(url) {
  const id = crypto.randomBytes(6).toString("hex");
  const outputDir = path.join(TMP_DIR, id);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputTemplate = path.join(outputDir, "%(playlist_index)03d_%(id)s.%(ext)s");

  try {
    // --write-info-json: sama alasannya kayak downloadAudio/downloadVideo di atas -- biar title-nya
    // bisa dibaca dari file lokal abis download, gak perlu run yt-dlp KEDUA KALINYA cuma buat itu
    // (sebelumnya di sini ada getInfo(url) terpisah setelah download beres -- 2x request ke
    // Instagram/TikTok per 1x slideshow, padahal biasanya isinya banyak foto & udah lumayan berat).
    await run(["--no-warnings", "--ignore-no-formats-error", "--write-info-json", "-o", outputTemplate, url]);
  } catch (err) {
    // Bersihin folder sisa sebelum lempar error ke pemanggil
    fs.rmSync(outputDir, { recursive: true, force: true });
    throw err;
  }

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort();

  if (!files.length) {
    fs.rmSync(outputDir, { recursive: true, force: true });
    throw new Error(
      "Gak ketemu foto/slide di link itu. Pastikan link-nya post carousel (Instagram) atau " +
      "slideshow/photo-mode (TikTok) yang isinya foto -- kalau post-nya sebenernya video biasa, " +
      "pakai command video (igdl/ttmp4) aja."
    );
  }

  const buffers = files.map((f) => fs.readFileSync(path.join(outputDir, f)));

  // Ambil title dari salah satu `.info.json` yang ditulis yt-dlp (satu per slide, isinya sama
  // aja buat field title/playlist_title karena masih dari post yang sama) -- fallback "slide"
  // kalau entah kenapa gak ketemu sama sekali.
  let title = "slide";
  const infoJsonFile = fs.readdirSync(outputDir).find((f) => f.endsWith(".info.json"));
  if (infoJsonFile) {
    try {
      const info = JSON.parse(fs.readFileSync(path.join(outputDir, infoJsonFile), "utf8"));
      title = info.playlist_title || info.title || info.fulltitle || title;
    } catch {
      // biarin fallback "slide" kalau json-nya kebetulan corrupt/gak lengkap
    }
  }

  fs.rmSync(outputDir, { recursive: true, force: true });
  return { buffers, title };
}

/** Ambil transkrip (subtitle otomatis) video YouTube sebagai teks polos */
async function getTranscript(url) {
  const id = crypto.randomBytes(6).toString("hex");
  const outputTemplate = path.join(TMP_DIR, id);

  await run([
    "--write-auto-sub", "--skip-download",
    "--sub-lang", "id,en",
    "--sub-format", "vtt",
    "--no-warnings",
    ...YOUTUBE_ARGS,
    "-o", outputTemplate,
    url,
  ]);

  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(id) && f.endsWith(".vtt"));
  if (!files.length) throw new Error("Transkrip tidak tersedia untuk video ini (tidak ada subtitle otomatis).");

  const raw = fs.readFileSync(path.join(TMP_DIR, files[0]), "utf8");
  fs.rmSync(path.join(TMP_DIR, files[0]), { force: true });

  const lines = raw
    .split("\n")
    .filter((l) => l.trim() && !l.includes("-->") && !/^WEBVTT/.test(l) && !/^\d+$/.test(l) && !/^Kind:|^Language:/.test(l))
    .map((l) => l.replace(/<[^>]+>/g, "").trim());

  return [...new Set(lines)].join(" ");
}

module.exports = { getInfo, downloadAudio, downloadVideo, downloadImages, getTranscript };
