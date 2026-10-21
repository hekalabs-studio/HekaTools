# 🤖 HekaBot — WhatsApp Bot

> Bot WhatsApp berbasis **Baileys** 📡, koneksi via **Pairing Code** 🔗, dengan menu Downloader & Tools lengkap.

🖥️ **Cross-platform** — jalan penuh di **Linux** (VPS/server), **Windows**, **macOS**, dan **Android via Termux** (proot-distro Ubuntu ATAU Debian). Kode-nya sendiri mendeteksi OS secara otomatis (lihat `lib/binaries.js`, `lib/ffmpeg.js`, `lib/ytdlp.js`, `lib/spawnWithTimeout.js`, `lib/pdfConvert.js`), jadi **gak ada langkah beda-beda per OS di level kode**. Yang beda cuma cara install dependency sistemnya (ffmpeg, yt-dlp, dll) — makanya disediakan script setup otomatis per platform di folder `scripts/`.

---

### 📑 Daftar Isi

| | |
|---|---|
| 🚀 [1. Instalasi Cepat](#-1-instalasi-cepat-pilih-sesuai-os-kamu) | 🏠 [13. Main Menu](#-13-main-menu) |
| 🔧 [1a. Instalasi Manual](#-1a-instalasi-manual-semua-os) | 👋 [14. Salam Sambutan Grup](#-14-salam-sambutan-grup--auto-tutorial) |
| ♾️ [1b. Jalankan 24/7](#️-1b-menjalankan-bot-terus-menerus-24-7-background) | 👥 [15. Group Menu](#-15-group-menu-admin-grup-only) |
| 📦 [2. Install](#-2-install) | 🗄️ [16. Database User](#️-16-database-user--hapus-akun-orang-lain-owner) |
| ⚙️ [3. Konfigurasi](#️-3-konfigurasi) | 🖼️ [17. Banner `.menu`](#️-17-banner-buat-menu) |
| 📱 [4. Jalankan & Scan QR](#-4-jalankan--scan-qr) | 📌 [Catatan Penting](#-catatan-penting) |
| ✨ [5. Coba Fitur](#-5-coba-fitur) | 📜 [Lisensi](#-lisensi) |
| 🔌 [6. Tentang API](#-6-tentang-api-downloadertools) | 💖 [Dukungan](#-dukungan) |
| 🗂️ [7. Struktur Project](#️-7-struktur-project) | ➕ [8. Nambah Fitur Baru](#-8-menambah-fitur-baru-nanti) |
| 🎮 [9. Fun & Game Menu](#-9-fun-menu--game-menu) | 🧠 [10. Fitur AI + Generate Gambar](#-10-fitur-ai-gemini-deepseek-groq-mistral--generate-gambar) |
| 🌐 [11. Internet Menu](#-11-internet-menu) | 📝 [12. Sistem Pendaftaran](#-12-sistem-pendaftaran) |

> 💡 Kalau link di atas gak nyambung persis di editor kamu, tinggal `Ctrl+F` judul section-nya aja — semua tetap gampang ditemukan.

---

## 🚀 1. Instalasi Cepat (pilih sesuai OS kamu)

| Platform | Perintah |
|---|---|
| **Linux** (Ubuntu/Debian, VPS) | `chmod +x scripts/setup-linux.sh && ./scripts/setup-linux.sh` |
| **macOS** (Homebrew) | `chmod +x scripts/setup-macos.sh && ./scripts/setup-macos.sh` |
| **Android (Termux + proot-distro Ubuntu/Debian)** | `chmod +x scripts/setup-termux-proot.sh && ./scripts/setup-termux-proot.sh` (dijalankan **di dalam** `proot-distro login ubuntu` ATAU `proot-distro login debian`, lihat komentar di file itu buat setup Termux-nya dulu — script-nya otomatis deteksi Ubuntu vs Debian) |
| **Windows** | Gak ada installer otomatis (Windows gak punya package manager standar) — ikuti langkah manual di bagian **[1a. Instalasi Manual](#1a-instalasi-manual-semua-os)** di bawah |

Tiap script otomatis install: **Node.js** (kecuali Linux, asumsi udah ada), **ffmpeg**, **yt-dlp**, **Python3 + poppler + library PDF**, **Real-ESRGAN** (opsional, buat `hdr` jalan lokal), lalu `npm install`. Setelah script selesai, lanjut ke **[4. Jalankan & Scan QR](#4-jalankan--scan-qr)**.

**Perbedaan penting per platform:**
- **Termux/Android**: gak ada systemd (proot cuma chroot, bukan container penuh) — buat bot jalan permanen di background pakai **pm2** (`pm2 start index.js --name hekabot`), bukan systemd. Fitur `.hdr` yang butuh GPU/Vulkan biasanya **gak jalan lokal** (proot gak expose akses GPU host) — tapi otomatis fallback ke PicsArt AI online, jadi tetap bisa dipakai. Detail lengkap & cara biar gak di-kill Android: lihat komentar di `scripts/setup-termux-proot.sh`.
- **Linux (VPS/server)**: bisa dipasang sebagai **systemd service** biar jalan 24/7 otomatis (auto-restart, auto-start pas reboot) — lihat `scripts/hekabot.service` dan `scripts/LINUX-SETUP.md`.
- **macOS**: Real-ESRGAN hasil download mungkin diblokir Gatekeeper ("cannot be opened karena developer gak terverifikasi") — kalau itu terjadi, jalankan `xattr -d com.apple.quarantine bin/realesrgan-ncnn-vulkan` sekali aja (script setup udah kasih tau ini juga di outputnya).
- **Windows**: semua binary (ffmpeg, yt-dlp, dll) taruh di folder `bin/` project ini — bot otomatis mendeteksinya duluan sebelum coba cari di PATH sistem, jadi **gak perlu edit Environment Variables Windows sama sekali**.

### ⚠️ Linux/Termux: `.brat` dan `.smeme` butuh font Microsoft, gak bawaan Linux

🔴 **Gejala** (kalau kejadian di kamu): `.brat` render tapi **teksnya gak muncul sama sekali** (canvas diam-diam gagal render font, gak throw error), dan `.smeme` tetap jalan tapi teksnya pakai font tipis biasa — **bukan** font tebal Impact yang seharusnya.

🔍 **Penyebab**: `.brat` (`lib/bratCanvas.js`) pakai font `"Arial Narrow"` / `Arial`, dan `.smeme` (`lib/textImage.js`) pakai `Impact` / `Arial Black`. Font-font ini **bawaan Windows/macOS**, dan **gak ada secara default di Linux/Ubuntu/Termux** — jadi khusus di Linux/Termux, dua fitur ini butuh 1 langkah tambahan yang gak diperlukan di Windows/macOS.

✅ **Fix (sudah otomatis dijalankan kalau kamu pakai `scripts/setup-linux.sh` atau `scripts/setup-termux-proot.sh`)** — install paket resmi Ubuntu `ttf-mscorefonts-installer`, isinya font Microsoft **asli** (Arial, Arial Black, Impact, dst), persis yang dicari kode `.brat`/`.smeme`. Hasilnya identik sama tampilan di Windows, bukan font pengganti yang cuma mirip-mirip.

Kalau kamu install manual (bukan lewat script), jalankan ini:
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository multiverse -y
sudo apt update

# Auto-setujui EULA Microsoft biar gak ngegantung nunggu prompt interaktif
echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | sudo debconf-set-selections

sudo apt install -y ttf-mscorefonts-installer
sudo fc-cache -f -v
```
(di Termux proot, hilangkan semua `sudo` — kamu sudah otomatis root di dalam proot)

Proses ini download font aslinya langsung dari server Microsoft/Sourceforge (butuh koneksi internet stabil, beberapa MB), lalu extract otomatis.

**Verifikasi font ke-install:**
```bash
fc-list | grep -i impact
fc-list | grep -i arial
```
Harus muncul baris kayak `.../Impact.ttf: Impact:style=Regular` dan beberapa varian Arial (Regular, Bold, Black, Narrow). Kalau kosong, font belum ke-install dengan benar.

Restart bot (`Ctrl+C` lalu `npm start` lagi), coba ulang `.brat halo` dan `.smeme hello|world` — hasilnya sekarang harusnya identik dengan di PC Windows.

**Kalau `add-apt-repository` error "command not found"** atau `apt update` gak nemu paketnya setelah itu: kemungkinan image dasar proot-distro Ubuntu kamu punya `sources.list` yang udah dipangkas (cuma `main`, tanpa `multiverse`). Tambahin manual 1 baris ke `/etc/apt/sources.list`, misal:
```
deb http://archive.ubuntu.com/ubuntu noble multiverse
```
(ganti `noble` sesuai versi Ubuntu kamu, cek dengan `lsb_release -cs`), lalu `apt update` ulang.

**Kalau kamu pakai proot-distro Debian (bukan Ubuntu)**: `scripts/setup-termux-proot.sh` dan `scripts/setup-linux.sh` sekarang otomatis deteksi Debian vs Ubuntu dan pakai nama komponen repo yang bener (`contrib non-free non-free-firmware` buat Debian, `multiverse` buat Ubuntu — dua distro ini beda penamaan komponen repo-nya, itu sebabnya versi sebelumnya gagal total di Debian karena maksa pakai `multiverse` yang emang gak dikenal Debian). Kalau masih gagal, edit manual `/etc/apt/sources.list` di dalam proot, tambahin `contrib non-free non-free-firmware` (Debian 12/bookworm ke atas) atau `contrib non-free` (Debian 11/bullseye ke bawah, tanpa `non-free-firmware`) di akhir tiap baris `deb ...` yang belum ada komponen itu.

### ⚠️ `.hdr 2` / `.hdr 3` (upscale bukan 4x) hasilnya pecah/kotak-kotak, tapi `.hdr` biasa (4x) mulus

🔴 **Gejala**: `.hdr` default (4x) hasilnya bagus, tapi `.hdr 2` atau `.hdr 3` menghasilkan gambar yang terpotong-potong jadi kotak dengan posisi/warna yang geser gak nyambung satu sama lain (kayak potongan puzzle yang salah susun).

🔍 **Penyebab**: model AI yang dipakai Real-ESRGAN (`x4plus`, `x4plus-anime`, dst) **dilatih cuma buat scale 4x** — itu satu-satunya scale asli yang didukung modelnya. Kalau binary `realesrgan-ncnn-vulkan` dikasih scale selain 4 (misal `-s 2`), dia tetap jalanin model yang sama di 4x, lalu resize hasilnya secara internal ke scale yang diminta — dan jalur resize non-4x ini punya bug tiling/seam yang cukup dikenal, terutama di GPU dengan VRAM kecil/driver terbatas (misal GPU mobile lewat proot Termux) yang otomatis motong gambar jadi tile-tile kecil buat diproses — hasil penyambungan antar tile-nya berantakan.

✅ **Fix**: sudah dibenarkan langsung di kode (`lib/upscale.js`) — binary Real-ESRGAN sekarang **selalu** dijalankan di scale native 4x (jalur yang teruji bersih, gak kena bug), lalu kalau kamu minta scale selain 4 (`.hdr 2`, `.hdr 3`), resize ke ukuran akhir yang diminta dilakukan manual pakai `sharp` di sisi Node — bukan lagi ngandelin resize internal binary yang buggy. Hasilnya tetap tajam (berbasis hasil 4x asli) dan gak ada lagi artefak kotak-kotak, di scale berapapun.

Kalau kamu pakai versi bot yang lebih lama dari perbaikan ini dan masih ketemu masalah ini, cukup update `lib/upscale.js` ke versi terbaru — gak perlu install ulang Real-ESRGAN atau apapun di sistem.

Ada juga command `.hdronline` kalau kamu mau langsung pakai PicsArt tanpa nyoba Real-ESRGAN lokal dulu (skip percobaan lokal, langsung online) — misalnya kalau kamu tau device kamu emang gak punya GPU/Vulkan yang layak, jadi gak perlu nunggu proses lokal gagal dulu baru fallback.

### ⚠️ Bot sering "melewati" pesan/command, harus dikirim ulang baru diproses

🔴 **Gejala**: kadang command yang dikirim gak dibales sama sekali, padahal di log server muncul baris kayak gini:
```
[upsert] batch DILEWATIN karena type="append" (bukan "notify"...) -- berisi 3 pesan, id=[...]
```
Terus habis kirim ulang commandnya, baru diproses normal.

🔍 **Penyebab**: bot ini sengaja ngabaiin batch pesan yang `type`-nya bukan `"notify"` (biasanya emang history sync pas bot reconnect — bukan pesan baru beneran, jadi memang gak boleh dibales, kalau enggak bot bisa keliatan "auto-reply" ke pesan-pesan lama). Tapi ternyata Baileys **kadang nge-tag pesan REAL-TIME (baru bener2 masuk barusan) dengan type `"append"`/`"replace"` juga**, bukan cuma buat history sync — ini lumayan sering kejadian khusus di pengirim yang pakai pengalamatan `@lid` (skema baru WhatsApp multi-device). Akibatnya command asli ke-skip diam-diam.

✅ **Fix**: sudah dibenarkan di `index.js` — sekarang bot gak lagi ngandelin `type` doang buat mutusin skip/proses. Tiap pesan di batch non-`"notify"` dicek **timestamp**-nya (`messageTimestamp`): kalau masih baru (<60 detik dari sekarang), berarti kemungkinan besar salah ke-tag Baileys, jadi **tetap diproses**. Yang beneran history sync (pesan lama dari sesi lampau) timestamp-nya jauh lebih tua dari 60 detik, itu yang tetap dilewatin seperti biasa.

Kalau kamu masih nemu kasus command ke-skip setelah fix ini, cek log-nya: kalau sekarang muncul baris `TETAP diproses` tapi commandnya tetap gak dibales, berarti penyebabnya beda (bukan filter type/timestamp lagi) — kirim potongan log-nya biar bisa ditelusuri lebih lanjut.

### 🔐 Nomor bot sendiri mau dipakai buat manggil command juga (misal kirim `.brat halo` dari HP yang nomornya dipakai bot)

Defaultnya **tidak bisa** — pesan yang dikirim dari nomor bot sendiri (`fromMe: true`) selalu diabaikan. Ini disengaja: kalau nomor bot lagi login di WhatsApp Web/aplikasi resmi di HP kamu juga, pesan yang kamu ketik manual dari sana ikut "kebaca" event yang sama kayak pesan masuk biasa, jadi perlu dibedain dulu apakah itu beneran mau diproses sebagai command atau bukan.

Buat ngaktifin, set di `config.js`:
```js
allowSelfCommands: true,
```

**Dibatasi ketat** — kalau diaktifkan, HANYA pesan yang diawali prefix command persis (misal `.brat halo`) yang diproses. Chat bebas tanpa prefix dari nomor bot **tetap diabaikan** walau `aiAutoChatPrivate` aktif. Ini sengaja buat mencegah **infinite loop**: kalau chat bebas dari nomor bot sendiri juga ikut diproses dan auto-chat AI aktif, balasan bot ke dirinya sendiri bisa kepancing dibales AI lagi, dibales lagi, dst tanpa henti sampai chat penuh/kuota API Gemini abis.

### ⚠️ `.igdl`/`.ttmp4`/downloader lain gagal terus dengan error "No video formats found", padahal yt-dlp udah paling baru

🔴 **Gejala**: error kayak `No video formats found!` atau `Instagram sent an empty media response`, khususnya buat link Instagram (tapi bisa juga TikTok/Facebook) — dan update yt-dlp ke versi terbaru sama sekali gak nolong, errornya tetap sama.

🔍 **Penyebab**: ini **bukan bug/versi ketinggalan** — dikonfirmasi resmi di halaman [KNOWN ISSUES yt-dlp](https://github.com/yt-dlp/yt-dlp/issues/17074): sejak ~2025, Instagram (dan kadang TikTok/Facebook) makin sering nolak request **tanpa login**, bahkan buat post/reels yang **publik**, bukan cuma konten private. Banyak laporan orang lain yang udah pakai yt-dlp versi nightly/master paling baru pun tetap kena error yang sama — jadi update yt-dlp aja gak akan menyelesaikan masalah ini.

✅ **Fix**: satu-satunya solusi yang didukung resmi yt-dlp adalah kasih **cookies** dari akun yang login.

1. Login ke Instagram (dan/atau TikTok) di browser Chrome/Firefox biasa
2. Install extension **"Get cookies.txt LOCALLY"** ([Chrome Web Store](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) / cari yang serupa buat Firefox)
3. Buka `instagram.com` (pastikan lagi login), klik icon extension-nya, export/download cookies-nya sebagai file `.txt` (format Netscape)
4. Kalau juga mau fix TikTok/Facebook, buka domain itu juga (masih login), export lagi — **atau** kalau kamu login ke banyak platform di browser yang sama, biasanya bisa export sekali untuk "All cookies" yang otomatis include semua domain
5. Rename file hasil export itu jadi **`cookies.txt`**, taruh di folder **`data/`** di dalam project ini — jadi path lengkapnya `data/cookies.txt`
6. Restart bot (`Ctrl+C` lalu `npm start` lagi) — file ini otomatis kedetect & dipakai buat SEMUA request yt-dlp mulai saat itu, gak perlu ubah kode apapun

🔐 **PENTING soal keamanan**: file `cookies.txt` ini isinya sesi LOGIN akun asli kamu — siapapun yang pegang file ini bisa login sebagai akun kamu di Instagram/TikTok. **Jangan pernah share file ini ke siapapun**, jangan upload ke GitHub publik (`.gitignore` di project ini udah otomatis nge-exclude `data/cookies.txt` biar gak ke-commit gak sengaja, tapi tetap hati-hati kalau kamu manage repo-nya manual).

**Cookies bisa kadaluarsa** — kalau udah pasang tapi tetap gagal error yang sama setelah beberapa minggu/bulan, kemungkinan sesi login-nya expired (logout otomatis). Export ulang dari browser yang masih login, ganti file `data/cookies.txt`-nya.

Kalau setelah pasang cookies masih tetap gagal (jarang, tapi bisa terjadi kalau IP server/VPS kamu juga lagi kena rate-limit terpisah dari soal login), coba beberapa menit lagi atau ganti IP (kalau di VPS, restart instance biasanya dapat IP baru).

### ⚠️ `.ttmp4`/`.ttmp3` gagal dengan error dari yt-dlp soal TikTok ("Unexpected response from webpage request", dst)

**Beda kasus** dari masalah cookies di atas — ini biasanya berarti TikTok baru aja ubah struktur halaman web mereka, dan extractor TikTok di yt-dlp belum sempat disesuaikan sama developernya. Ini pola yang **sering banget** terjadi ke TikTok secara khusus (cek riwayat issue tracker yt-dlp, kejadian berulang setiap beberapa bulan) — biasanya kepatch dalam hitungan hari sampai 1-2 minggu.

✅ **Fix**: sudah otomatis ditangani — `.ttmp4` dan `.ttmp3` sekarang coba yt-dlp lokal dulu (general-purpose, biasanya lebih cepat), kalau gagal otomatis fallback ke **TikWM** (`lib/tikwm.js`), API publik gratis khusus TikTok yang maintain scraper-nya sendiri secara terpisah dari yt-dlp — jadi kadang tetap jalan normal pas yt-dlp lagi bermasalah kayak gini (dan sebaliknya).

Kalau KEDUANYA gagal bersamaan (jarang), berarti kemungkinan videonya emang private/dihapus, atau TikTok lagi ada masalah lebih luas — coba beberapa saat lagi atau update yt-dlp (`pip install -U yt-dlp --break-system-packages`) buat jaga-jaga siapa tau pas itu udah ada patch baru.

### 📸 Download FOTO (bukan cuma video) — Facebook, slideshow Instagram & TikTok

| Command | Isi | Fallback kalau yt-dlp gagal |
|---|---|---|
| `.fbdl` | Video Facebook | Scraper `lib/facebookDl.js` (ringan, HTTP biasa) |
| `.fbphoto` | Foto/album Facebook | **Langsung** scraper `lib/facebookDl.js` — yt-dlp gak dicoba sama sekali, karena yt-dlp itu tool download VIDEO, gak pernah bisa extract foto dari post FB |
| `.igslide` | Carousel/slideshow Instagram (foto) | Gak ada fallback API (lihat penjelasan di bawah) — solusinya pasang cookies |
| `.ttslide` | Slideshow/photo-mode TikTok | TikWM (`lib/tikwm.js`) |

**Kenapa `.igslide` gak punya fallback API kayak yang lain:** satu-satunya implementasi publik yang saya temuin buat scraping foto Instagram butuh **Puppeteer** (otomasi browser Chromium) — itu artinya install tambahan **~300MB** dan seringkali gak jalan mulus di Termux/proot Android. Itu kontradiktif sama tujuan bot ini tetap ringan & jalan di semua platform termasuk HP. Jadi buat Instagram, solusi utamanya tetap **pasang cookies** (`data/cookies.txt`, lihat section di atas) — itu udah nolongin `.igdl` sebelumnya, dan harusnya nolongin `.igslide` juga karena akar masalahnya sama (Instagram wajib login).

### 🎵 Kenapa file MP3 (`.ytmp3`, `.ttmp3`, `.playmp3`, `.cutmp3`, dll) sebelumnya suka kesave sebagai `.MPEG`, bukan `.mp3`

🔍 **Root cause**: semua fitur MP3 di bot ini awalnya ngirim file lewat tipe pesan `audio` (`reply({ audio: buffer, mimetype: "audio/mpeg", fileName: "judul.mp3" })`). Masalahnya, tipe pesan `audio` di protokol WhatsApp **sama sekali gak punya field buat nama file** (cuma tipe pesan `document` yang punya) — jadi `fileName` yang dikasih itu **diam-diam diabaikan**. WhatsApp cuma punya `mimetype: "audio/mpeg"` buat nebak ekstensinya sendiri, dan tergantung OS/file manager, `audio/mpeg` (MIME umum yang nyakup MP1/MP2/MP3 sekaligus, gak spesifik nunjuk `.mp3`) itu kadang ke-mapping jadi `.mpeg`/`.mpga` alih-alih `.mp3`.

✅ **Fix**: sekarang dikirim sebagai tipe pesan `document` (lewat helper baru `lib/audioReply.js`) — tipe ini BENERAN punya field nama file, jadi WhatsApp wajib pakai nama persis `judul.mp3`, gak ada tebak-tebakan MIME lagi.

⚖️ **Trade-off yang jujur perlu diketahui**: tampilannya di chat WhatsApp jadi bubble **file** (ikon dokumen + nama file + ukuran), **bukan** player audio inline kayak musik/voice note biasa (gak ada tombol play besar/waveform langsung di bubble chat). Ini bukan batasan bot/Baileys — WhatsApp sendiri di level protokol emang gak nyediain cara buat dapet player inline SEKALIGUS kontrol penuh nama file, dua hal itu saling eksklusif.

**Karena itu, `.play` sengaja dipisah jadi 2 command** biar dua kebutuhan itu (dengerin cepat VS nyimpen file) sama-sama kepenuhin:
- **`.play`** — kirim sebagai `audio` (player inline, bisa langsung didengerin di chat), tapi kalau di-download/forward nama filenya bisa jadi `.mpeg`/generik, bukan `.mp3`. Cocok buat DENGERIN CEPAT.
- **`.playmp3`** — kirim sebagai `document` (nama file dijamin `judul.mp3` yang bener), tapi tampil sebagai bubble file, bukan player inline. Cocok buat NYIMPEN/FORWARD filenya.



### 🔧 1a. Instalasi Manual (semua OS)

Kalau gak mau pakai script otomatis (atau di Windows yang emang gak ada script-nya), install manual satu-satu:

- **Node.js v18+** → cek dengan `node -v`. Download dari https://nodejs.org (semua OS)
- **ffmpeg** (untuk fitur `tomp3`, `tovn`, `cutmp3`, dan dipakai `yt-dlp` untuk convert ke mp3)

  Pilih salah satu cara:
  1. **Via package manager**: Ubuntu/Debian `sudo apt install ffmpeg -y`, macOS `brew install ffmpeg`, Termux (di dalam proot Ubuntu) `apt install ffmpeg`
  2. **Tanpa install ke sistem** (paling gampang di Windows): download dari https://www.gyan.dev/ffmpeg/builds/ (pilih **"release essentials"**), extract file zip-nya, lalu copy **`ffmpeg.exe`** DAN **`ffprobe.exe`** (ada di folder `bin` hasil extract) ke folder `bin/` di dalam project ini. Bot otomatis mendeteksi keduanya duluan sebelum coba cari di PATH sistem.
- **yt-dlp** (untuk fitur `ytmp3`, `ytmp4`, `play`, `ytfull`, `yttranscript` — ini dipakai supaya fitur YouTube **tidak bergantung pada API pihak ketiga yang sering berubah/rusak**)

  Pilih salah satu cara:
  1. **Via pip** (kalau sudah ada Python, berlaku semua OS termasuk macOS/Termux): `pip3 install --break-system-packages yt-dlp` (atau `pip install yt-dlp` kalau flag itu gak dikenal), lalu **tutup & buka ulang terminal**. Cek: `yt-dlp --version`
  2. **Tanpa Python** (paling gampang di Windows): download `yt-dlp.exe` dari https://github.com/yt-dlp/yt-dlp/releases/latest, lalu taruh filenya di `bin/yt-dlp.exe` di dalam folder project ini. Bot otomatis mendeteksi file itu duluan sebelum coba cari di PATH sistem — jadi gak perlu utak-atik Environment Variables Windows sama sekali.

- **Real-ESRGAN** (opsional, untuk fitur `hdr` — upscale/HD gambar pakai AI, **jalan lokal, tanpa API luar**, butuh GPU/Vulkan)
  - Kalau binary ini gak ketemu/gak jalan (misal di Termux proot yang gak punya akses Vulkan, atau device kamu emang gak punya GPU), `hdr` **otomatis fallback ke PicsArt AI Enhancement** (layanan online gratis, dipanggil langsung lewat `lib/picsartUpscale.js`, bukan lewat aggregator API pihak ketiga) — jadi fitur ini tetap bisa dipakai walau tanpa GPU, cuma lebih lambat.
  1. Download dari https://github.com/xinntao/Real-ESRGAN/releases — pilih file sesuai OS: `-windows.zip` (Windows), `-macos.zip` (macOS), `-ubuntu.zip` (Linux/Termux proot)
  2. Extract **semua isinya** (binary + folder `models` + file lain di sebelahnya) ke folder `bin/` di project ini — jangan cuma binary-nya doang, folder `models` **wajib** ikut ke-copy di folder yang sama
  3. Hasil akhirnya: `bin/realesrgan-ncnn-vulkan(.exe)` dan `bin/models/` ada di folder yang sama
  4. **Khusus macOS**: kalau muncul peringatan "cannot be opened" (Gatekeeper), jalankan `xattr -d com.apple.quarantine bin/realesrgan-ncnn-vulkan`

- **LibreOffice** (untuk fitur `topdf` khusus dokumen office seperti docx/xlsx/pptx → pdf, **jalan lokal, tanpa API luar**)
  - Ubuntu/Debian/VPS: `sudo apt install -y libreoffice`
  - macOS: `brew install --cask libreoffice`
  - Windows: download & install dari https://www.libreoffice.org/download/download-libreoffice/ (pilih tombol "Download" besar, installer biasa next-next-finish). **Gak perlu edit PATH** — bot otomatis nyari di lokasi instalasi default (`C:\Program Files\LibreOffice\program\soffice.exe` di Windows, `/Applications/LibreOffice.app/Contents/MacOS/soffice` di macOS, `/usr/bin/soffice` di Linux)

- **Python 3 + Poppler + beberapa library** (untuk fitur `todocx`, `toexcel`, `topptx` — convert PDF ke Word/Excel/PowerPoint, **jalan lokal, tanpa API luar**)
  - Ubuntu/Debian/VPS/Termux: `sudo apt install -y python3 python3-pip poppler-utils` (di Termux proot, tanpa `sudo`)
  - macOS: `brew install python3 poppler`
  - Windows:
    1. Install Python dari https://www.python.org/downloads/ (**wajib centang "Add python.exe to PATH"** saat instalasi)
    2. Download poppler dari https://github.com/oschwartz10612/poppler-windows/releases (ambil file `Release-xx.xx.x-0.zip`)
    3. Extract, lalu **copy folder `Library\bin`-nya (isinya, bukan foldernya)** ke `bin\poppler\` di dalam project ini — jadi hasilnya ada file-file kayak `bin\poppler\pdftoppm.exe`. Sama kayak pola ffmpeg/yt-dlp di bot ini: **gak perlu edit PATH sistem**, bot otomatis nemu dari situ duluan
  - Lanjut di semua OS: `pip3 install --break-system-packages pdf2docx pdf2image python-pptx openpyxl pdfplumber` (di Windows, pakai `py -m pip install pdf2docx pdf2image python-pptx openpyxl pdfplumber` — lebih tahan banting daripada `pip install` polos, apalagi kalau command `python`/`pip` masih ke-alias sama Microsoft Store)

## ♾️ 1b. Menjalankan bot terus-menerus (24/7 background)

Setelah bot berhasil di-pairing sekali (lihat bagian 4), kamu bisa jalankan sebagai proses background biar gak perlu buka terminal terus:

- **Linux (VPS/server)**: pakai **systemd** — copy `scripts/hekabot.service` ke `/etc/systemd/system/`, edit `User=`/`WorkingDirectory=` sesuai server kamu, lalu `sudo systemctl enable --now hekabot`. Detail lengkap ada di komentar file itu, atau `scripts/LINUX-SETUP.md`.
- **macOS / Termux/Android**: gak ada systemd (macOS punya `launchd` tapi lebih ribet setup-nya, Termux proot gak punya init system sama sekali) — cara paling gampang & konsisten di semua OS: pakai **pm2**:
  ```bash
  npm install -g pm2
  pm2 start index.js --name hekabot
  pm2 save
  pm2 logs hekabot     # lihat log / QR pairing pertama kali
  ```
  Khusus **Termux**: tambahkan juga `termux-wake-lock` + matikan Battery Optimization buat app Termux di setting Android, biar prosesnya gak di-kill sistem pas HP idle (detail di `scripts/setup-termux-proot.sh`).
- **Windows**: `pm2` juga bisa dipakai sama seperti di atas. Alternatif paling simpel: biarin terminal (cmd/PowerShell) tetap terbuka selama bot mau jalan, atau minimize aja jendelanya.



## 📦 2. Install

```bash
cd hekabot
npm install
```

## ⚙️ 3. Konfigurasi

Buka `config.js`, isi:
- `ownerNumber`, `ownerName`, `instagram`, `portfolio` → sudah kuisi sesuai identitas HekaBot kamu
- `prefix` → default `.` (bisa diganti string kosong `""` kalau mau tanpa prefix)

## 📱 4. Jalankan & Scan QR

```bash
npm start
```

- Akan muncul **QR code** di terminal.
- Buka WhatsApp di HP → **Perangkat Tertaut** → **Tautkan Perangkat** → scan QR tersebut.
- Setelah berhasil, session tersimpan otomatis di folder `session/` — kamu tidak perlu scan ulang selama folder itu tidak dihapus.
- QR code hanya berlaku ±20 detik. Kalau keburu hilang sebelum sempat di-scan, tunggu saja — bot otomatis generate QR baru.

## ✨ 5. Coba fitur

Kirim ke bot:
```
menu
```
untuk melihat semua fitur. Command lain dipanggil dengan prefix, contoh:
```
.ytmp3 https://youtube.com/watch?v=xxxxx
.kalkukator 25*4+10
.removebg   (reply sebuah foto)
```

## 🔌 6. Tentang API downloader/tools

Sebagian besar fitur sekarang **jalan lokal** (gak butuh API pihak ketiga sama sekali):
- **yt-dlp**: `ytmp3`, `ytmp4`, `play`, `ytfull`, `yttranscript`, **`fbdl`, `igdl`, `igslide`, `threads`, `ttmp3`, `ttmp4`, `ttslide`, `twitter`** (yt-dlp support 1700+ situs, gak cuma YouTube; `pinterestdl` sekarang scraping langsung, yt-dlp cuma fallback -- lihat baris di bawah)
- **ffmpeg**: `tomp3`, `tovn`, `cutmp3`
- **Real-ESRGAN** (dengan fallback PicsArt online kalau gak tersedia): `hdr`
- **PicsArt online langsung** (skip percobaan lokal): `hdronline`
- **@imgly/background-removal-node**: `removebg`
- **tesseract.js**: `ocr`
- **Google Drive langsung** (tanpa API): `drivelink`
- **catbox.moe** (upload publik, bukan API tebak-tebakan): `tourl`
- **@damarkuncoro/posindonesia** (dataset offline ~80.000+ data): `kodepos`
- **sharp / wa-sticker-formatter**: `sticker`, `take`, `swm`, `brat`, `bratvid`, `qc`, `smeme`, `squote` (semua sticker menu, jalan lokal)
- Murni lokal tanpa dependency luar: `kalkukator`, `readmore`
- `infodevice` — LOKAL, pakai `getDevice()` dari Baileys buat cek platform WhatsApp pengirim
  (Android/iOS/Web/Desktop). Sekarang buat cek device SI PENGIRIM, bukan spek server bot lagi —
  spek server sekarang dilihat lewat `.bot` (ringkas) atau `.resource` (lengkap, owner only).
  Catatan: WhatsApp gak pernah kasih data hardware asli (RAM/prosesor/model HP) ke bot manapun,
  jadi ini cuma bisa deteksi APLIKASI-nya, bukan spek fisik HP-nya.
- Quote generator API terpisah (bukan siputzx, biasanya stabil): `iqc`

Sisanya masih memanggil sumber pihak ketiga langsung (scraper/API publik spesifik per fitur, masing-masing punya modul `lib/` sendiri) karena platformnya gak didukung yt-dlp / butuh data real-time:
- `capcutdl` (`lib/capcutDl.js`), `telesticker` (`lib/telestickerDl.js`) — scraper khusus platform masing-masing
- `cekbillpln` (`lib/cekPlnDl.js`) — butuh data real-time PLN, gak ada cara lokal
- `recolor` (`lib/recolorDl.js`) — belum ada model colorize portable kayak Real-ESRGAN

(`rednotedl`, `spotifydl`, `teradl`, `teraview`, `scribddl`, `slidesharedl` udah dihapus dari menu — API-nya gak pernah ketemu path yang jalan/situsnya diproteksi ketat tanpa API publik, dan khusus `spotifydl` emang gak mungkin gratis karena Spotify pakai DRM.)

> 📌 Kalau salah satu fitur di atas mulai error terus-menerus, kemungkinan besar situs sumbernya berubah struktur — kabari lewat pesan error yang muncul, biasanya sudah cukup detail buat ditelusuri lebih lanjut.
## 🗂️ 7. Struktur project

```
hekabot/
├── 🚀 index.js              # koneksi Baileys + pairing code
├── 🧭 handler.js             # router command
├── ⚙️  config.js               # identitas bot & pengaturan
├── 📁 scripts/
│   ├── setup-linux.sh       # installer otomatis (Linux/VPS)
│   ├── setup-macos.sh       # installer otomatis (macOS)
│   ├── setup-termux-proot.sh # installer otomatis (Android/Termux)
│   ├── hekabot.service       # template systemd service (Linux)
│   └── LINUX-SETUP.md         # panduan detail setup Linux
├── 📚 lib/                    # ~70 modul: API wrapper, downloader, converter, game, dst
│   ├── api.js              # wrapper API multi-provider (endpoint map terpusat)
│   ├── binaries.js          # resolusi lokasi binary cross-platform (ffmpeg/yt-dlp/soffice/dst)
│   ├── picsartUpscale.js     # fallback online buat hdr (dipanggil kalau Real-ESRGAN lokal gak ada)
│   ├── kodepos.js           # cari kode pos Indonesia, LOKAL/offline
│   ├── extract.js          # cari URL/teks di response API yang formatnya beda-beda
│   ├── media.js             # ambil media (gambar/video/audio) dari pesan/reply
│   ├── transfer.js          # download buffer & upload sementara ke catbox.moe
│   ├── ffmpeg.js             # convert audio/video (tomp3, tovn, cutmp3)
│   ├── menu.js               # generator teks menu
│   └── ...                    # (lihat isi folder lib/ buat daftar lengkap)
├── 🕹️ commands/                # 1 file = 1 kategori menu bot
│   ├── downloader.js         # menu Downloader
│   ├── converter.js           # menu Converter
│   ├── tools.js                 # menu Tools
│   ├── internet.js             # menu Internet
│   ├── sticker.js               # menu Sticker
│   ├── fun.js                   # menu Fun
│   ├── game.js                  # menu Game
│   ├── group.js                 # menu Group (admin grup)
│   ├── main.js                  # menu Main (info bot, database, dll)
│   ├── auth.js                  # daftar/hapusakun/deleteuser
│   ├── ai.js                     # .ai/.deepai/.groqai/.mistralai/.resetai (chat multi-provider)
│   └── solve.js                  # .solve (kerjain soal dari foto/dokumen)
├── 🧰 bin/                     # taruh binary eksternal di sini (ffmpeg, yt-dlp, dst) — lihat `bin/README.md`
├── 🎨 assets/                  # font & banner buat fitur sticker/canvas — lihat `assets/README.md`
├── 💾 data/                    # data persisten bot (user, statistik game, cookies) — lihat `data/README.md`
├── 🔑 session/                 # sesi login WhatsApp (dibuat otomatis abis scan QR)
└── 🗑️ tmp/                     # file sementara pas proses convert/download (dibersihkan otomatis)
```

## ➕ 8. Menambah fitur baru nanti

Tinggal tambah object baru di `commands/downloader.js` atau `commands/tools.js`:
```js
{
  name: "namafitur",
  run: async ({ jid, sock, text, args, reply, m }) => {
    // logika fitur di sini
  },
}
```
Otomatis kebaca oleh `handler.js`, tidak perlu registrasi manual di tempat lain.

## 🎮 9. Fun Menu & Game Menu

**Fun Menu (13 fitur)**: semuanya jalan 100% lokal, generator teks random (kadang deterministik berdasarkan nama/teks yang dikasih, kadang murni acak). Gak butuh API.

**Game Menu (12 fitur)**: semuanya jalan penuh, gak ada yang placeholder. Mekanismenya tanya-jawab (nunggu jawaban di chat tanpa prefix, ada timer 45 detik, bisa ketik *nyerah*), kecuali `minesweeper` & `ulartangga` yang interaktif pakai perintah lanjutan:
- `asahotak`, `tebaktebakan`, `tebakbendera`, `tebakkata`, `tebakpresiden`, `tebakpokemon`, `susunkata`, `terasaurus`
- `minesweeper` (grid interaktif, ketik koordinat kayak `minesweeper A1`)
- `ulartangga` (dadu, ketik `ulartangga roll`)
- `kuisislami`, `kuismtk` (kuis edukasi level SMA kelas 12)

Game-game yang dulu direncanain tapi gak sempat dibikinin bank soalnya (`tebakdrakor`, `tebaklirik`, `werewolf`, dan lain-lain yang butuh kurasi konten/hak cipta) udah **dihapus dari menu** — bukan dibiarin jadi placeholder, biar menu-nya jujur cuma nampilin yang beneran jalan.

Bank soal ada di `lib/gameData.js` dan `lib/funData.js` — tinggal tambah item baru di array-nya kalau mau nambah variasi soal. Catatan: sistem jawabnya cocok-cocokan teks persis (setelah dibersihin spasi/simbol), jadi kadang variasi ejaan jawaban gak kebaca sama persis kayak yang diharapkan — kalau nemu itu, kabari aku, bisa disesuain.

## 🧠 10. Fitur AI (Gemini, DeepSeek, Groq, Mistral) + Generate Gambar

Bot ini punya 4 pilihan AI chat (beda provider, beda karakteristik) dan 1 fitur generate gambar dari teks.

| Command | Provider | Status |
|---|---|---|
| `.ai` (alias `.tanya`, `.chat`, `.gemini`) | Gemini | Gratis permanen |
| `.deepai` (alias `.deepseek`) | DeepSeek | Jatah gratis awal, abis itu bayar |
| `.groqai` (alias `.groq`) | Groq | Gratis permanen (limit request/menit-hari) |
| `.mistralai` (alias `.mistral`) | Mistral | Tier gratis "Experiment", rate-limited |
| `.imajin` (alias `.imagine`, `.gambarai`, `.txt2img`) | NaraRouter | Berbayar per gambar (murah, ~Rp10/gambar) |

Masing-masing punya riwayat obrolan sendiri-sendiri — ganti-ganti command gak bikin AI-nya "lupa" konteks satu sama lain.

### Setup

Bikin API key gratis di provider yang mau dipakai (gak wajib isi semuanya, tinggal command yang key-nya kosong yang gak bisa dipakai — fitur lain tetap normal):

| Provider | Bikin key di | Butuh kartu kredit? |
|---|---|---|
| Gemini | https://aistudio.google.com/apikey | Tidak |
| Groq | https://console.groq.com/keys | Tidak |
| DeepSeek | https://platform.deepseek.com/api_keys | Tidak buat mulai, tapi saldo abis kalau kepake |
| Mistral | https://console.mistral.ai/api-keys | Tidak |
| NaraRouter | https://router.bynara.id/keys (atau `router.naraya.ai`) | Tidak buat mulai, tapi generate gambar dipotong saldo |

Isi API key yang didapat ke `.env` (bukan `config.js` — lihat `.env.example` buat nama variabelnya: `GEMINI_API_KEY_1`, `GROQ_API_KEY_1`, `DEEPSEEK_API_KEY_1`, `MISTRAL_API_KEY_1`, `NARA_API_KEY_1`). Boleh isi lebih dari satu key per provider (`_2`, `_3`, dst) kalau punya lebih dari satu akun — bot otomatis gantian key kalau salah satu kena limit. Restart bot abis isi `.env`.

### Cara pakai

```
.ai jelasin apa itu lubang hitam
.deepai gimana caranya masak nasi goreng enak
.groqai bikinin puisi tentang hujan
.mistralai apa bedanya let sama const di javascript
.imajin kucing oranye pakai jaket astronot, gaya cat air
.resetai        ← reset SEMUA riwayat obrolan di 4 provider chat sekaligus (owner only)
```

Bot inget konteks obrolan sebelumnya (10 giliran terakhir per provider per orang) selama belum di-reset atau bot di-restart. `.imajin` gak punya riwayat/konteks — tiap generate berdiri sendiri.

**🛡️ Anti-overload (fallback model, khusus Gemini)**: model default (`gemini-flash-latest`, alias "terbaru") itu yang paling ramai dipakai orang lain juga, jadi paling gampang kena pesan *"Model Gemini lagi kebanjiran request"* pas jam sibuk. Bot udah otomatis retry beberapa kali, dan kalau overload-nya tetep menetap, otomatis coba lagi pakai model cadangan (`geminiFallbackModel` di `config.js`) sebelum benar-benar nyerah ke user. Mau matiin fallback ini? Set `geminiFallbackModel: ""` di `config.js`.

**`.solve` — kerjain soal dari FOTO ATAU DOKUMEN** (pakai model vision Gemini, `gemini-flash-latest` udah support gambar & PDF native):
```
.solve                              ← kirim/reply foto ATAU dokumen, caption .solve doang
.solve jelasin caranya aja          ← boleh tambah instruksi setelah .solve
```
Kirim foto/dokumen langsung dengan caption `.solve`, atau reply foto/dokumen yang udah ada di chat lalu ketik `.solve`.
Isinya **bebas jenis apa aja** — bukan cuma soal matematika: soal pelajaran (fisika, kimia, bahasa, dll),
potongan kode/pesan error, captcha/teka-teki, tabel yang perlu dihitung, formulir, tulisan tangan, dan
lain-lain. Beda dari `.ai`, `.solve` gak nyambung ke riwayat obrolan (sekali jalan per-file) dan pakai
system prompt sendiri (`solveSystemPrompt` di `config.js`) yang didesain buat "kerjain apa yang ada di foto/dokumen",
bukan ngobrol bebas.

**Format dokumen yang didukung**, tiap jenis ditangani beda cara:
- **PDF** — dikirim langsung ke Gemini, dibaca native (teks, tabel, diagram, layout halaman) tanpa convert apapun.
- **Word (doc/docx), Excel (xls/xlsx), PowerPoint (ppt/pptx), ODT/ODS/ODP, RTF** — di-convert dulu ke PDF pakai LibreOffice (lokal, sama mesin yang dipakai `.topdf`), baru dibaca Gemini kayak PDF biasa. Convert-ke-PDF dipilih sengaja (bukan extract teks polos) biar tabel/gambar/layout dokumennya ikut kebaca utuh, bukan cuma teksnya doang.
  - ⚠️ Di device low-spec (RAM di bawah 4GB, termasuk kebanyakan setup Termux), jalur convert ini **dinonaktifkan otomatis** (sama kayak `.topdf`) biar RAM gak kewalahan — tapi PDF/foto tetap bisa dipakai normal di device manapun, cuma jalur convert Word/Excel/PPT-nya aja yang dibatasi.
- **TXT** — isinya dibaca langsung sebagai teks (dibatasi 30.000 karakter pertama, cukup buat kebanyakan soal/tugas).
- **Foto (jpg/png/dst)** — sama kayak sebelumnya, kirim ke Gemini vision.

**Opsional — mode auto-chat** (bot otomatis bales SEMUA chat pribadi kayak asisten AI, gak perlu ketik `.ai` dulu): buka `config.js`, ubah:
```js
aiAutoChatPrivate: true,
```
Ini **cuma aktif di chat pribadi** (japri), bukan di grup — biar bot gak spam bales semua orang di grup tanpa diminta.

## 🌐 11. Internet Menu

| Fitur | Sumber | Reliabilitas |
|---|---|---|
| `wikipedia` | Wikipedia REST API resmi | ✅ Solid, gak akan bermasalah |
| `cuaca` | Open-Meteo (gratis, tanpa key) | ✅ Solid, gak akan bermasalah |
| `ai` / `resetai` | Gemini API kamu | ✅ Solid (asal API key diisi, lihat bagian 10) |
| `solve` | Gemini API kamu (vision) | ✅ Solid (asal API key diisi, lihat bagian 10) |
| `alkitab` | SABDA (alkitab.sabda.org, endpoint `passage.php?mode=text`) | ⚠️ Bukan API resmi/JSON, hasil di-parse dari HTML — bisa berubah sewaktu-waktu. *(Diperbaiki Agustus 2026: endpoint lama `api/passage/` sudah mati, sekarang pakai `passage.php?mode=text`.)* |
| `alquran` / `quran` | API resmi equran.id (`equran.id/api/v2`) | ✅ JSON resmi, gratis, tanpa API key — lebih stabil dari `alkitab` |
| `kbbi` | Scraping typoonline.com | ⚠️ Paling rawan putus, bergantung struktur halaman pihak ketiga |
| `lirik` | lyrics.ovh | ⚠️ Wajib format *Artis - Judul*; hasil DIBATASI cuma cuplikan (bukan lirik lengkap, demi hak cipta) |
| `pinterest` | Scraping pinterest.com (API pencarian internal, butuh cookies session) | ⚠️ Pinterest cukup agresif soal anti-bot, paling mungkin diblokir sewaktu-waktu |
| `pinterestdl` | Scraping halaman pin publik langsung (`lib/pinterestDl.js`, bisa foto MAUPUN video, gak butuh cookies), fallback yt-dlp | Lebih tahan banting dari `pinterest` karena gak lewat API pencarian yang gampang diblokir |

Cara pakai `alquran`:
```
.alquran Al-Fatihah        ← info surat (arti, tempat turun, jumlah ayat)
.alquran Al-Baqarah 255    ← baca 1 ayat (Arab + latin + terjemahan)
.alquran Yasin 1-5         ← baca range ayat (maks 20 ayat sekali baca)
.alquran 2 255              ← nomor surat langsung juga bisa
```

Kalau `alkitab`/`kbbi`/`pinterest` mulai error, kirim pesan errornya ke saya (Claude), nanti dicek lagi sumbernya.

## 📝 12. Sistem Pendaftaran

Sekarang **wajib daftar dulu** sebelum bisa pakai fitur bot (kecuali `menu`, `help`, `daftar`, `profil`).

```
.daftar Budi Santoso    ← daftar
.profil                 ← cek data diri
.hapusakun              ← batal daftar
```

Data tersimpan di **file** `data/users.json` (bukan cuma di memori) — jadi **aman biar bot di-restart** (`Ctrl+C` → `npm start` lagi, atau laptop mati-nyala biasa). Data cuma hilang kalau file/folder `data/` sengaja dihapus.

Mau matiin fitur wajib daftar ini? Buka `config.js`, ubah:
```js
requireRegistration: false,
```

## 🏠 13. Main Menu

Fitur umum/info bot, plus sistem pendaftaran dipindah ke sini:

| Fitur | Fungsi |
|---|---|
| `bot` | Info singkat bot (uptime, owner) + sistem server (platform/CPU/RAM/Node.js) |
| `daftar` | Daftar (wajib sebelum pakai fitur lain) |
| `database` | Statistik: jumlah user terdaftar, total fitur |
| `hapusakun` | Batal daftar |
| `help` | Panduan cara pakai bot (bisa diakses walau belum daftar) |
| `list` | Ringkasan jumlah fitur per kategori |
| `menu` | Daftar lengkap semua fitur |
| `owner` | Kirim kontak asli owner (vCard) |
| `ping` | Cek latensi bot |
| `profile` | Lihat profil pendaftaran kamu (alias dari `profil`) |
| `resource` | Spesifikasi & pemakaian server (CPU/RAM) |
| `runtime` | Lama bot udah nyala |
| `speedtest` | Tes kecepatan download koneksi server |
| `status` | Set status "About" WhatsApp bot |

## 👋 14. Salam Sambutan Grup + Auto-Tutorial

Kalau bot ada di sebuah grup:
- **Member baru masuk** → bot otomatis kirim salam sambutan (tag nama) + kirim tutorial cara pakai bot
- **Member keluar** → bot kirim salam perpisahan

Mau matiin ini? Buka `config.js`, ubah:
```js
groupWelcomeEnabled: false,
```

## 👥 15. Group Menu (admin grup only)

| Fitur | Fungsi |
|---|---|
| `kick` | Keluarkan member (reply/mention/nomor) |
| `promote` | Jadikan admin |
| `demote` | Turunkan dari admin |
| `mute` | Kunci grup (cuma admin bisa chat) |
| `unmute` | Buka kunci grup |
| `tagall` | Mention semua member (kelihatan daftarnya) |
| `hidetag` | Mention semua member (tanpa nampilin daftar nama) |
| `linkgrup` | Ambil link invite grup |

🔒 **Wajib**: cuma bisa dipakai kalau kamu **admin di grup itu** (atau owner bot, bisa dari grup manapun). Kalau dipakai di luar grup (chat pribadi), otomatis ditolak.

💡 **Penting**: fitur-fitur ini butuh **bot-nya sendiri juga jadi admin** di grup itu — kalau bot bukan admin, WhatsApp bakal nolak semua aksi ini (kick, mute, dll), gak peduli siapa yang minta.

## 🗄️ 16. Database User & Hapus Akun Orang Lain (Owner)

`.database` sekarang nampilin **listing lengkap** semua user terdaftar (ID, nama, nomor, tanggal daftar, status) — **khusus owner**, karena isinya data pribadi/nomor telepon orang.

Hapus akun orang lain (khusus owner), 2 cara:
```
.hapusakun U001
.deleteuser U001
```
`.hapusakun` **tanpa** argumen tetap seperti biasa — hapus akun **diri sendiri**, bisa dipakai siapa aja.

## 🖼️ 17. Banner buat `.menu`

Sekarang `.menu` kirim **gambar banner dulu**, baru daftar menunya. **Taruh file banner kamu di:**
```
hekabot/assets/banner_menu.jpg
```
(boleh juga `.jpeg`, `.png`, atau `.webp` — pakai salah satu nama file: `banner_menu.jpg`/`banner_menu.jpeg`/`banner_menu.png`/`banner_menu.webp`)

Kalau file itu belum ada, bot otomatis skip bagian gambar dan langsung kirim menu teks aja (gak error).

Ada juga 2 banner opsional lain buat salam sambutan/perpisahan grup (lihat **[14. Salam Sambutan Grup](#-14-salam-sambutan-grup--auto-tutorial)**):
- `assets/banner_intro.jpg` — dikirim saat member baru masuk grup
- `assets/banner_out.jpg` — dikirim saat member keluar grup

Ketiganya pakai pola nama & extension yang sama (`lib/banner.js`), dan sama-sama opsional — bot jalan normal tanpa gambar apapun.

## 📌 Catatan Penting

- ⚠️ Ini pakai WhatsApp Web multi-device (tidak resmi/unofficial). Gunakan nomor sekunder, jangan nomor utama, untuk menghindari risiko banned oleh WhatsApp.
- 🚫 Jangan spam request ke API publik — bisa kena rate limit/block IP.
- 🔒 **Chat pribadi ke bot kadang gak diproses / bot kelihatan gak responsif?** Kemungkinan besar ini error kode **463** dari server WhatsApp ("reach-out time-lock") — BUKAN bug di kode bot ini, tapi pembatasan dari WhatsApp sendiri yang paling sering kena di nomor yang pernah di-banned/di-unban atau nomor baru yang belum "dipanaskan". Sejak update ini, kalau kejadian lagi bakal ada log jelas di terminal (cari `[ack]` atau `kode 463`). Kalau sering muncul: jangan kirim pesan ke banyak nomor asing sekaligus dalam waktu singkat, pastikan `@whiskeysockets/baileys` versi terbaru (`npm update @whiskeysockets/baileys`), dan kalau nomornya emang pernah kena pembatasan WA, mungkin perlu nunggu beberapa hari atau pakai nomor lain. Detail teknisnya ada di [issue #2441 di repo Baileys](https://github.com/WhiskeySockets/Baileys/issues/2441).

## 📜 Lisensi

HekaBot (kode bot: `NHA-01`) dilisensikan dengan lisensi custom — lihat file [`LICENSE`](./LICENSE) untuk teks lengkapnya. Ringkasnya:

- ✅ Boleh dipakai/dimodifikasi bebas untuk **keperluan pribadi/non-komersial**.
- 🏷️ **Wajib mencantumkan atribusi** ke owner asli (nama, kontak, link dukungan di bawah) di setiap salinan/fork/redistribusi.
- 🚫 **Dilarang mengklaim** sebagai karya sendiri atau menjual tanpa izin tertulis owner.
- 📦 Disediakan **"AS IS"** tanpa jaminan apa pun.

| | |
|---|---|
| 👤 **Owner** | Novemas Heka A |
| 📞 **WhatsApp** | +6289514433486 |
| 📷 **Instagram** | [@novemash3kaa](https://instagram.com/novemash3kaa) |
| 🌐 **Portfolio** | [hekaportfolio.web.app](https://hekaportfolio.web.app) |

## 💖 Dukungan

Kalau HekaBot bermanfaat buat kamu, dukung pengembangannya lewat:

👉 **https://saweria.co/NovemasHeka** ☕

Command `.support` di bot juga menampilkan ringkasan lisensi + link dukungan ini.
# HekaTools
