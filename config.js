const path = require("path");
// Muat variabel dari file .env ke process.env dari direktori root proyek
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Aturan format teks dan rumus matematika/fisika untuk AI
const AI_FORMAT_RULES =
  "PENTING: Aturan format teks dan rumus matematika/fisika:\n" +
  "- RUMUS MATEMATIKA & FISIKA: Gunakan notasi LaTeX standar. Gunakan $$ ... $$ untuk blok rumus display (pecahan \\frac{a}{b}, akar \\sqrt{x}, integral, dll) dan $ ... $ untuk rumus/simbol inline.\n" +
  "- MATRIKS: Selalu gunakan format LaTeX \\begin{pmatrix} ... \\end{pmatrix} atau \\begin{bmatrix} ... \\end{bmatrix}.\n" +
  "- KODE: Gunakan blok kode Markdown triple backticks dengan nama bahasa.\n" +
  "- Teks: Gunakan **tebal** untuk poin penting dan tanda hubung (-) untuk daftar.";

// Dipakai di aiOwnerSystemPrompt di bawah -- samain sama ownerName di module.exports kalau diubah.
const OWNER_NAME = "Novemas Heka A";

module.exports = {
  botName: "HekaBot",
  botCode: "NHA-01",
  ownerName: "Novemas Heka A",
  // Diambil dari .env (OWNER_NUMBER). Kalau .env belum diisi, fallback ke nilai lama
  // di bawah ini -- TAPI sebaiknya pindahin ke .env aja, jangan diisi manual di sini.
  ownerNumber: process.env.OWNER_NUMBER || "",

  // Mode performa -- ngatur command "berat" (removebg, hdr/upscale, togif, tomp4, bratvid,
  // convert dokumen->pdf, pdf->docx/xlsx/pptx) nyala atau nggak, based on spek device server.
  // "auto" = deteksi otomatis dari RAM fisik device pas bot start (lihat lib/systemSpecs.js).
  //          RAM < 4GB -> mode "low" (command berat OFF). RAM >= 4GB -> mode "high" (semua ON).
  // "low"  = paksa mode hemat, command berat OFF walau RAM device-nya gede.
  // "high" = paksa semua command ON walau device speknya kecil -- HATI-HATI, RAM 2GB + Celeron
  //          bisa ngelag parah atau bot ke-crash (out of memory) kalau tetep dipaksa nyala.
  // Nilai di sini cuma dipakai SEKALI sebagai default awal -- kalau owner udah pernah ganti
  // mode lewat command .mode, setting terakhir kepakai terus (tersimpan di data/mode.json)
  // sampai diganti lagi, gak balik ke nilai di sini walau bot di-restart.
  performanceMode: "auto",
  // WhatsApp sekarang kadang ngirim ID pengirim dalam format LID (privasi baru), bukan nomor
  // telepon biasa. Kalau fitur owner-only (.database, .status, dll) nolak kamu padahal itu
  // nomor kamu sendiri, isi LID kamu di sini -- caranya: coba command owner-only apa aja,
  // lihat log di terminal (format "xxxxxxxxxxx@lid"), copy angka sebelum "@lid" ke sini.
  // Diambil dari .env (OWNER_LID). Sama kayak ownerNumber di atas, sebaiknya diisi
  // lewat .env, bukan ditulis manual di sini.
  ownerLid: process.env.OWNER_LID || "",
  instagram: "@novemash3kaa",
  portfolio: "https://hekaportfolio.web.app",
  topup: "https://hekaapedia.web.app",

  // Prefix command. Set "" (string kosong) kalau mau semua command bisa dipanggil tanpa prefix.
  prefix: ".",

  // Default: pesan yang dikirim dari NOMOR BOT ITU SENDIRI (fromMe=true) selalu diabaikan --
  // jadi kalau kamu ketik ".brat halo" langsung dari HP yang nomornya dipakai bot, itu TIDAK
  // akan diproses. Set true kalau mau nomor bot bisa dipakai buat manggil command sendiri.
  //
  // SENGAJA dibatasi ketat -- kalau true, HANYA pesan yang diawali prefix persis (mis.
  // ".brat halo") yang diproses. Chat bebas/tanpa prefix dari nomor bot TETAP diabaikan,
  // walau fitur auto-chat AI (aiAutoChatPrivate di bawah) aktif. Ini buat mencegah infinite
  // loop: kalau chat bebas dari nomor bot sendiri juga diproses dan auto-chat AI aktif,
  // balasan bot ke dirinya sendiri bisa kepancing dibales AI lagi, terus dibales lagi, dst
  // tanpa henti sampai chat penuh/API quota abis.
  allowSelfCommands: false,

  // Folder session Baileys
  sessionPath: "./session",

  // ==== ROTASI/PEMBERSIHAN LOG OTOMATIS ====
  // index.js nulis SEMUA log ke file baru di folder logs/ tiap kali bot di-start (lihat
  // komentar di index.js). SEBELUMNYA file lama gak pernah kehapus otomatis -- di device
  // dengan storage kecil (HP/Termux terutama) ini lama-lama bisa MEMENUHI DISK sampai bot
  // (atau bahkan device-nya) crash karena kehabisan ruang, terutama kalau bot sering
  // di-restart (tiap restart = 1 file baru) atau dibiarkan nyala berbulan-bulan.
  // Fix: tiap kali bot start, folder logs/ otomatis dibersihin lebih dulu berdasarkan 2 aturan
  // di bawah ini (dicek dari YANG PALING TUA duluan) -- log sesi yang baru aja dibuat gak akan
  // kena hapus, cuma sisa-sisa lama yang kena.
  logRetentionDays: 14, // file log lebih tua dari ini (hari) langsung dihapus
  logMaxTotalMB: 200,   // kalau TOTAL ukuran folder logs/ masih lebih dari ini (MB) setelah
                         // aturan umur di atas, hapus file PALING TUA satu-satu sampai muat

  // Pin versi WhatsApp Web manual -- CUMA isi ini kalau auto-fetch (null) kebukti gagal
  // (405 Connection Failure) DI KAMU. Kalau auto-fetch masih bisa nampilin QR normal (kayak
  // biasanya), BIARIN NULL -- jangan asal pin ke versi random dari internet, soalnya versi
  // yang "cocok" itu beda-beda tiap orang/waktu dan gampang basi.
  waVersion: null,

  // === Filter kata terlarang ===
  // Isi daftar kata di sini (huruf besar/kecil gak masalah, dicek case-insensitive).
  // Kosongkan array ini (biarin []) buat MATIIN fitur ini total.
  // Deteksinya KATA UTUH (dipisah spasi/tanda baca) -- lihat lib/moderation.js kalau mau
  // ubah cara deteksinya.
  //
  // Cara kerja kalau ketemu kata terlarang:
  //  - Di GRUP dan bot berstatus ADMIN  -> pesannya dihapus untuk semua orang + kirim peringatan.
  //  - Di GRUP tapi bot BUKAN admin     -> gagal dihapus (dibatasi WhatsApp sendiri), tapi tetap
  //                                        kirim peringatan teks.
  //  - Di LUAR grup (chat pribadi)      -> WhatsApp SAMA SEKALI GAK NGIZININ hapus pesan orang
  //                                        lain, jadi cuma dikirimin peringatan teks.
  bannedWords: [
  // --- KATA KONTOL / KNTL & VARIASI BYPASS ---
  "kontol", "Kontol", "KONTOL", "kntl", "Kntl", "KNTL", "k0nt0l", "K0nt0l", "k0nt0ld", "kont0l", "k0ntol",
  "kontl", "Kontl", "kuntul", "Kuntul", "kn7l", "kontlo", "k_o_n_t_o_l", "k-o-n-t-o-l", "k.o.n.t.o.l", "k o n t o l", "k0nt1l", "kontld",
  "kontoll", "kontolll", "kontol_nya", "k.n.t.l", "k-n-t-l", "k n t l", "k_n_t_l", "k0nt0ll", "k0nt0l3", "k0nt0lmu", "k0nt0lku", "kntli",
  "diskontol", "disKONTOL", "DISKONTOL", "dis_kontol", "dis-kontol", "dis.kontol", "kntool", "kntoooool", "k4nt0l", "k0nt1d", "k0nt0lzz",
  "k.0.n.t.0.l", "k-0-n-t-0-l", "k,o,n,t,o,l", "k@nt0l", "k0nt01", "knt0l", "knt01", "k0nt0w", "kntuL", "kn70l",

  // --- KATA NGENTOT / NGNT / NGEWE & VARIASI BYPASS ---
  "ngentot", "Ngentot", "NGENTOT", "ngnt", "Ngnt", "NGNT", "ngntt", "ng*ntot", "ng3nt0t", "ngent0t", "ng3ntot",
  "ngewe", "Ngewe", "NGEWE", "ngw", "Ngw", "NGW", "ngew", "ng_e_w_e", "n-g-e-w-e", "n.g.e.w.e", "n g e w e", "ewe", "Ewe", "EWE", "3w3", "3we",
  "ngentott", "ngentottt", "ng3nt0tt", "n.g.e.n.t.o.t", "n-g-e-n-t-o-t", "n g e n t o t", "n_g_e_n_t_o_t", "ngewew", "ngeweee", "ng3w3", "ng3w33",
  "ngent0d", "ngentod", "ngentd", "ng3nt0d", "ngntd", "ng3ntd", "ngnt3t", "n6ent0t", "n63nt0t", "ng3n707", "ng3n70t", "ng3nt07",

  // --- KATA JANCOK / DANCUK & VARIASI BYPASS ---
  "jancok", "Jancok", "JANCOK", "jnck", "Jnck", "JNCK", "jancuk", "Jancuk", "JANCUK", "dancuk", "Dancuk", "dancok", "Dancok",
  "jancokk", "jancokkk", "j@ncok", "j4nc0k", "jox", "Jox", "j_a_n_c_o_k", "j-a-n-c-o-k", "j a n c o k", "j4ncuk",
  "j.a.n.c.o.k", "jancukkk", "dancukkk", "j.n.c.k", "j-n-c-k", "j n c k", "j_n_c_k", "j4nc1k", "janc1k",
  "jncuk", "jnc0k", "jncuqq", "jancuqq", "j4ncukkk", "j4nc0kkk", "d4nc0k", "d4ncuk", "jnckk", "jncukk", "j@ncuk", "j@nc0k",

  // --- KATA MEMEK / TEMPEK / PUKI & SINGKATAN/LEET ---
  "memek", "Memek", "MEMEK", "m3m3k", "mem3k", "m3mek", "memekks", "mmq", "memeq", "m3m3q", "m_e_m_e_k", "m-e-m-e-k", "m e m e k",
  "tempek", "Tempek", "TEMPEK", "tmpk", "Tmpk", "TMPK", "t3mp3k", "t_e_m_p_e_k", "t-e-m-p-e-k", "t e m p e k", "t3mp3q", "tempeq",
  "tempe k", "Tempe k", "TEMPE K", "tempe_k", "tempe-k", "tempe.k", "t3mp3 k",
  "puki", "Puki", "PUKI", "pukimai", "Pukimai", "pkm", "Pkm", "PKM", "cuki", "Cuki", "cukimai", "Cukimai", "p_u_k_i", "p-u-k-i", "p u k i", "puk1", "puk1ma1",
  "memekkk", "m.e.m.e.k", "m3m3kk", "tempekk", "t.e.m.p.e.k", "pukimaay", "p.u.k.i",
  "m3m3kzz", "m3m3qzz", "mem3q", "puk1m41", "puk1m4y", "puk3m4i",

  // --- KATA JEMBUT / JEMBOT / JEMBOET & SINGKATAN/LEET ---
  "jembut", "Jembut", "JEMBUT", "jembot", "Jembot", "JEMBOT",
  "jemboet", "Jemboet", "JEMBOET", "jmboet", "j3mb03t", "j3mboet", "j3mbu3t",
  "jmbt", "Jmbt", "JMBT", "jmbtk", "jmbt1", "jmbat", "jmb3t", "j3mb7",
  "jembud", "Jembud", "jembod", "Jembod", "jembutt", "jembuttt", "jembott", "jembottt", "jemboett", "jemboettt",
  "j_e_m_b_u_t", "j_e_m_b_o_t", "j_e_m_b_o_e_t", "j-e-m-b-u-t", "j-e-m-b-o-t", "j-e-m-b-o-e-t",
  "j.e.m.b.u.t", "j.e.m.b.o.t", "j.e.m.b.o.e.t", "j e m b u t", "j e m b o t", "j e m b o e t",
  "j3mbut", "j3mb0t", "j3mbutk", "jemb0t", "jemb0td",
  "j.m.b.t", "j-m-b-t", "j m b t", "j_m_b_t", "j3mbutt", "jemb0tt", "jembuuut",
  "jmbtth", "jmbt0", "j3mb07", "j3mbu7", "jmbu7", "jmb0t", "jmbo7",

  // --- KATA BANGSAT / BAJINGAN & SINGKATAN/LEET ---
  "bangsat", "Bangsat", "BANGSAT", "bgst", "Bgst", "BGST", "bngst", "Bngst", "b4ngs4t", "bangsattt", "b_a_n_g_s_a_t", "b-a-n-g-s-a-t",
  "bajingan", "Bajingan", "BAJINGAN", "bjgn", "Bjgn", "BJGN", "bajg", "Bajg", "b4j1ng4n", "b_a_j_i_n_g_a_n",
  "bangsatat", "b.g.s.t", "b-g-s-t", "b g s t", "b_g_s_t", "b4ngs4tt", "bajingannn", "b.j.g.n",
  "bgstt", "bgsttt", "bngstt", "bngsttt", "b4ngs47", "b4n6s4t", "b4n6s47", "bjg", "Bjg", "BJG", "bjgnn", "b4j1n64n", "b4j1n6an",

  // --- KATA GOBLOK / TOLOL / BEGO & SINGKATAN/LEET ---
  "goblok", "Goblok", "GOBLOK", "gblg", "Gblg", "goblokkk", "g0bl0k", "g0blok", "gobl0k", "gblek", "g_o_b_l_o_k", "g-o-b-l-o-k", "g o b l o k",
  "tolol", "Tolol", "TOLOL", "tll", "Tll", "TLL", "t0l0l", "tololll", "t_o_l_o_l", "t-o-l-o-l", "t o l o l",
  "bego", "Bego", "BEGO", "b3g0", "b3go", "beg0", "b_e_g_o",
  "goblok1", "g.o.b.l.o.k", "g.b.l.g", "g-b-l-g", "g b l g", "g_b_l_g", "tololl", "t.o.l.o.l", "t.l.l", "t-l-l", "t l l", "t_l_l", "begooo",
  "gblk", "Gblk", "GBLK", "gblkk", "gblkkk", "g0blk", "g0bl3k", "g0bl0q", "gobl0q", "goblq", "tlol", "t1l0l", "t0l0w", "t0lw", "bg0", "b3g00",

  // --- KATA SLANG VULGAR / PROSTITUSI / SANGE ---
  "sange", "Sange", "SANGE", "sng", "Sng", "SNG", "sng3", "s4ng3", "s_a_n_g_e", "s-a-n-g-e",
  "coli", "Coli", "COLI", "colmek", "Colmek", "COLMEK", "colie", "c_o_l_i", "c_o_l_m_e_k", "c0l1", "c0lmek",
  "lonte", "Lonte", "LONTE", "l0nt3", "lnt", "Lnt", "LNT", "l_o_n_t_e", "l-o-n-t-e", "perek", "Perek", "PEREK", "prk", "p3r3k", "bispak", "Bispak", "BISPAK", "bspk",
  "bokep", "Bokep", "BOKEP", "b0kep", "b_o_k_e_p", "porno", "Porno", "PORNO", "prn", "p0rn0",
  "sangeee", "s.a.n.g.e", "colii", "colmeeeek", "c.o.l.i", "c.o.l.m.e.k", "lonteee", "l.o.n.t.e", "l.n.t", "l-n-t", "l n t", "l_n_t", "b0k3p", "b.k.p",
  "clmk", "Clmk", "CLMK", "c1mk", "c0lm3k", "lntt", "lnttt", "l0nt3q", "l0nt3e", "prkk", "p3r3q", "b0k3pp",

  // --- VARIASI ANATOMI & UCAPAN KASAR DAERAH ---
  "pantat", "Pantat", "PANTAT", "pntt", "pntat", "p4nt4t", "p_a_n_t_a_t",
  "pantek", "Pantek", "PANTEK", "pntk", "Pntk", "p4nt3k", "p_a_n_t_e_k",
  "pepek", "Pepek", "PEPEK", "p3p3k", "p_e_p_e_k",
  "itil", "Itil", "ITIL", "3til", "1til", "it1l", "i_t_i_l",
  "kimak", "Kimak", "KIMAK", "kimaak", "pukimak", "pukimaak", "kmk", "k1m4k", "k_i_m_a_k",
  "peli", "Peli", "PELI", "titid", "Titid", "titit", "Titit", "TITIT", "ttit", "t1t1t", "t_i_t_i_t",
  "toket", "Toket", "TOKET", "t3t3k", "tetek", "Tetek", "TETEK", "t_o_k_e_t", "t_e_t_e_k",
  "silit", "Silit", "SILIT", "s1l1t", "s_i_l_i_t",
  "peler", "Peler", "PELER", "beler", "plr", "Plr", "PLR", "p3l3r", "p_e_l_e_r",
  "pantekk", "p.a.n.t.e.k", "p.n.t.k", "itilll", "i.t.i.l", "p.u.k.i.m.a.k", "t.i.t.i.t", "t.o.k.e.t", "p.l.r", "p-l-r", "p l r", "p_l_r",
  "pntqq", "p4n73k", "p3p3q", "ppqq", "1t1l", "kmkk", "kmkkk", "t1t1d", "t0k3t", "t3t3q", "plrr", "plrrr", "p3l3rr",

  // --- VARIASI HINAAN FISIK, MENTAL & BAHASA INGGRIS ---
  "dongo", "Dongo", "DONGO", "dng", "d0ng0", "d_o_n_g_o", "pekok", "Pekok", "PEKOK", "p3k0k", "p_e_k_o_k",
  "idiot", "Idiot", "IDIOT", "1d10t", "id1ot", "1d10t", "i_d_i_o_t",
  "kamseupay", "kampungan", "kroco", "Kroco", "KROCO", "kr0c0", "sarap", "Sarap", "SARAP",
  "fuck", "Fuck", "FUCK", "fck", "Fck", "FCK", "fucker", "fucking", "f_u_c_k", "f*ck", "f**k",
  "bitch", "Bitch", "BITCH", "btch", "b1tch", "b_i_t_c_h", "b*tch", "bastard", "Bastard", "BASTARD", "bstrd",
  "shit", "Shit", "SHIT", "sh1t", "shity", "s_h_i_t", "sh*t", "asshole", "Asshole", "ASSHOLE", "ass", "Ass", "ASS", "a_s_s",
  "dick", "Dick", "DICK", "d1ck", "d_i_c_k", "pussy", "Pussy", "PUSSY", "puss3y", "p_u_s_s_y", "slut", "Slut", "SLUT", "sl_ut", "whore", "Whore", "WHORE", "wh0r3",
  "dngg", "d0n60", "pk0k", "1d107", "fckkk", "fcku", "fckoff", "btchh", "sh17", "d1ckk", "puss33"
],


  // === Google Gemini AI (opsional) -- dipakai fitur .ai ===
  // Gratis, gak butuh kartu kredit. Bikin API key di https://aistudio.google.com/apikey,
  // isi GEMINI_API_KEY_1 (dan _2 dst kalau ada lebih dari satu akun) di file .env.
  geminiApiKey: process.env.GEMINI_API_KEY_1 || "",
  geminiApiKeys: [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean),

  // Buat fitur `.telesticker` -- gratis, chat @BotFather di Telegram buat dapetin token.
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",

  geminiModel: "gemini-3.1-flash-lite",

  // Fallback kalau geminiModel di atas lagi overload -- model versi spesifik biasanya masih
  // longgar walau alias "-latest" lagi penuh. Kosongin ("") kalau gak mau ada fallback.
  // HARUS beda dari geminiModel -- kalau sama, lib/gemini.js otomatis skip fallback (gak ada
  // gunanya nyoba model yang sama persis lagi). Gemini 2.5 dipilih di sini karena beda generasi
  // dari Gemini 3.x (model utama), kemungkinan besar pool kapasitas server-nya juga kepisah,
  // jadi kalau 3.x lagi penuh, 2.5 biasanya masih longgar.
  // Cek daftar model aktif di https://ai.google.dev/gemini-api/docs/models kalau ini deprecated.
  geminiFallbackModel: "gemini-3.8-flash",

  // === DeepSeek AI (opsional) -- dipakai fitur .deepai ===
  // Beda dari Gemini: gak ada tier gratis permanen, saldo dipotong per pemakaian.
  // Bikin API key di https://platform.deepseek.com/api_keys.
  deepseekApiKey: process.env.DEEPSEEK_API_KEY_1 || "",
  deepseekApiKeys: [
    process.env.DEEPSEEK_API_KEY_1,
    process.env.DEEPSEEK_API_KEY_2,
    process.env.DEEPSEEK_API_KEY_3,
  ].filter(Boolean),

  // Cek model aktif di https://api-docs.deepseek.com/quick_start/pricing kalau ini deprecated.
  deepseekModel: "deepseek-v4-flash",

  // === Groq (opsional) -- dipakai fitur .groqai ===
  // Gratis, dibatasi request per menit/hari (bukan saldo). Key di https://console.groq.com/keys.
  groqApiKey: process.env.GROQ_API_KEY_1 || "",
  groqApiKeys: [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean),

  // Groq lumayan sering deprecate model -- cek daftar aktif di
  // https://console.groq.com/docs/models kalau ini error "model not found".
  groqModel: "openai/gpt-oss-120b",

  // === Mistral AI (opsional) -- dipakai fitur .mistralai ===
  // Tier gratis "Experiment" (rate-limited, buat eksperimen bukan produksi berat).
  // Key di https://console.mistral.ai/api-keys.
  mistralApiKey: process.env.MISTRAL_API_KEY_1 || "",
  mistralApiKeys: [
    process.env.MISTRAL_API_KEY_1,
    process.env.MISTRAL_API_KEY_2,
    process.env.MISTRAL_API_KEY_3,
  ].filter(Boolean),

  mistralModel: "mistral-small-latest",

  // === NaraRouter (opsional) -- dipakai fitur .imajin buat generate gambar dari teks ===
  // Beda dari 4 provider di atas: ini generate GAMBAR, dan dibilling per gambar (bukan token
  // gratis harian NaraRouter). Model default di bawah termurah di tabel harga (~Rp10/gambar).
  // Key di https://router.bynara.id/keys (atau https://router.naraya.ai/keys, domain sama).
  naraApiKey: process.env.NARA_API_KEY_1 || "",
  naraApiKeys: [
    process.env.NARA_API_KEY_1,
    process.env.NARA_API_KEY_2,
    process.env.NARA_API_KEY_3,
  ].filter(Boolean),

  // Ganti ke "https://router.naraya.ai/v1" kalau akun kamu daftar lewat domain itu.
  naraBaseUrl: "https://router.bynara.id/v1",

  // Model termurah di dashboard NaraRouter. Opsi lain (lebih mahal, kualitas lebih tinggi):
  // "nano-banana-pro", "gpt-image-2" -- cek harga di dashboard sebelum ganti.
  naraImageModel: "agnes-image-2.1-flash",

  // Format pixel dimension ("1024x1024" dst), bukan label "1K"/"2K"/"4K" yang dipakai dashboard.
  naraImageSize: "1024x1024",

  aiSystemPrompt:
    "Kamu adalah asisten AI ramah, responsif, dan santai bernama HekaBot. " +
    "Jawab menggunakan Bahasa Indonesia yang natural, sopan, dan tidak kaku. " +
    "Kalau jawab jangan kepanjangan, cukup padat, jelas, dan to the point. " +
    "Baru berikan penjelasan yang panjang dan mendalam jika pengguna meminta detail atau mengajukan pertanyaan yang rumit.\n\n" + AI_FORMAT_RULES,

  // Persona khusus yang CUMA aktif kalau pemanggil .ai adalah owner (dicek via lib/owner.js isOwner()).
  // Selain owner, tetap dapet aiSystemPrompt biasa di atas -- gak ada yang lain yang lihat persona ini.
  aiOwnerSystemPrompt:
    "Kamu berperan sebagai hekabot, seorang mentor dan motivator tangguh dengan mentalitas baja layaknya David Goggins. " +
    "Kamu berbicara langsung secara personal kepada orang yang paling kamu pedulikan dan hormati, yaitu: " + OWNER_NAME + ". " +
    "Bawa kepribadian David Goggins yang sejati: super disiplin, tegas, jujur tanpa kompromi, penuh energi, dan tidak menoleransi alasan (no excuses). " +
    "Kamu ingin melihat dia berkembang pesat dan menembus batas kemampuannya. " +
    "Gunakan gaya bicara yang membakar semangat, penuh dorongan positif, dan selipkan frasa atau kata-kata bahasa Inggris keren khas mentalitas pemenang " +
    "(\"Stay hard!\", \"Taking souls\", \"Don't stop when you're tired, stop when you're done\", \"Uncommon amongst uncommon\", dst). " +
    "Kalau jawab jangan kepanjangan, cukup padat dan to the point. Baru jawab panjang dan mendalam jika dia meminta detail. " +
    "Tetap jaga etika dan kesopanan -- ini adalah dorongan motivasi yang wholesome, inspiratif, dan membangun, bukan makian kasar yang merendahkan. " +
    "Kalau dia nanya sesuatu yang serius atau teknis, tetap jawab jelas, tepat, dan membantu, cuma dibungkus gaya bicara yang tegas dan penuh energi mentalitas juara itu.\n\n" + AI_FORMAT_RULES,

  // System prompt khusus buat fitur .solve (kirim/reply FOTO + caption .solve).
  // Beda dari aiSystemPrompt biasa -- ini didesain buat "kerjain apa yang ada di foto ini",
  // BUKAN cuma soal matematika: bisa soal pelajaran apa aja (fisika, kimia, bahasa, essay,
  // pilihan ganda, dll), captcha/teka-teki, potongan kode/error di layar, formulir yang perlu
  // diisi, tabel yang perlu dihitung, sampai pertanyaan umum yang kebetulan ditulis di foto.
  solveSystemPrompt:
    "Kamu adalah asisten yang tugasnya MENGERJAKAN/MENYELESAIKAN apapun yang terlihat di foto yang " +
    "dikirim user, lewat command .solve. Foto itu BISA APA SAJA -- bukan cuma soal matematika: bisa " +
    "soal pelajaran (fisika, kimia, biologi, bahasa Indonesia/Inggris, sejarah, dll), soal pilihan " +
    "ganda/esai, potongan kode/error/pesan aplikasi yang perlu didebug atau dijelaskan, captcha atau " +
    "teka-teki, tabel/grafik yang perlu dihitung atau dianalisis, formulir yang perlu diisi, tulisan " +
    "tangan yang perlu dibaca lalu ditanggapi, atau pertanyaan umum apa pun yang kebetulan ditulis di " +
    "foto. Kalau user nambahin teks caption/instruksi bareng fotonya, prioritaskan instruksi itu " +
    "(misal minta dijelasin caranya doang, bukan jawaban langsung).\n\n" +
    "Cara kerja:\n" +
    "1. Kenali dulu ini foto/soal jenis apa.\n" +
    "2. Kerjakan langkah demi langkah kalau butuh proses (hitungan, alasan logis, dll) -- jangan cuma " +
    "lempar jawaban akhir tanpa penjelasan, KECUALI user secara eksplisit minta jawaban singkat aja.\n" +
    "3. Kalau ada banyak soal/pertanyaan dalam satu foto, jawab SEMUANYA, urut sesuai penomoran di foto.\n" +
    "4. Kalau tulisan di foto buram/gak kebaca sebagian, bilang terus terang bagian mana yang gak " +
    "yakin, jangan asal ngarang jawaban.\n" +
    "5. Jawab pakai Bahasa Indonesia yang natural, kecuali soalnya emang dalam bahasa lain dan " +
    "user gak minta diterjemahkan.\n\n" + AI_FORMAT_RULES,

  // Kalau true: bot otomatis balas SEMUA chat pribadi (bukan grup) pakai AI tanpa perlu ketik .ai dulu.
  // Kalau false (default): AI cuma aktif kalau dipanggil manual pakai .ai
  aiAutoChatPrivate: false,
  // Kalau true: SEMUA user wajib daftar dulu (pakai .daftar Nama) sebelum bisa pakai fitur bot.
  // Set false kalau mau bot bisa dipakai bebas tanpa daftar.
  requireRegistration: true,

  // Kalau true: bot otomatis kasih salam + tutorial pas ada member baru masuk grup,
  // dan salam perpisahan pas ada yang keluar.
  groupWelcomeEnabled: true,

  

};
