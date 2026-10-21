# 🐧 Menjalankan HekaTools 100% di Linux & Termux PRoot (tanpa Windows)

> ✅ Kabar baik: kode HekaTools **sudah cross-platform dari awal**: semua pencarian binary (`ffmpeg`, `yt-dlp`, `soffice`, `realesrgan`, `python`) di `lib/binaries.js`, `lib/ytdlp.js`, `lib/ffmpeg.js`, `lib/pdfConvert.js`, `lib/spawnWithTimeout.js` sudah cek `process.platform` dan otomatis pakai versi Linux kalau dijalankan di Linux.

**Gak ada satu baris kode pun yang perlu diedit.** Yang dibutuhkan cuma dua hal:
1. 📦 Install dependency versi Linux (ffmpeg, yt-dlp, python, fonts)
2. 🔁 Jalankan server di background (systemd atau pm2)

---

## 🚀 Langkah Cepat (VPS/server Ubuntu atau Debian)

```bash
# 1️⃣ Masuk ke folder project
cd hekabot

# 2️⃣ Jalankan installer otomatis (install ffmpeg, yt-dlp, libreoffice,
#    python + poppler, Real-ESRGAN Linux build, lalu npm install)
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh

# 3️⃣ Test jalan server
npm start
```

Buka browser di laptop/HP: `http://localhost:3000` (atau `http://<IP-SERVER>:3000`). Website HekaTools langsung tampil dan siap digunakan! 🚀

## ♾️ Biar Jalan Terus-Menerus (24/7) di Background

Setelah test jalan lancar, matikan (`Ctrl+C`) lalu pasang sebagai **systemd service** supaya:
- 🌙 Jalan otomatis di background (gak perlu SSH/terminal tetap terbuka)
- 🔄 Auto-restart kalau crash
- 🔌 Auto-start lagi kalau server reboot

Lihat instruksi lengkap di komentar file `scripts/hekabot.service`: intinya:

```bash
sudo cp scripts/hekabot.service /etc/systemd/system/hekabot.service
# edit dulu User= dan WorkingDirectory= di file itu sesuai server kamu
sudo systemctl daemon-reload
sudo systemctl enable --now hekabot

# lihat log server realtime:
sudo journalctl -u hekabot -f
```

## 🔀 Alternatif: pm2 (Sangat cocok untuk VPS dan Termux PRoot)

```bash
npm install -g pm2
pm2 start server.js --name hekatools
pm2 save
pm2 startup   # ikuti instruksi yang muncul biar auto-start pas reboot
pm2 logs hekatools
```

## 📋 Catatan Fitur yang Butuh Binary Tambahan di Linux

| Fitur | Dependency Linux | Cara install |
|---|---|---|
| 🎵 `tomp3`, `tovn`, `cutmp3`, + convert audio yt-dlp | ffmpeg | `sudo apt install ffmpeg` |
| ⬇️ `ytmp3`, `ytmp4`, `play`, `fbdl`, `igdl`, dll | yt-dlp | `pip3 install --break-system-packages yt-dlp` |
| 🖼️ `hdr` (upscale AI) | Real-ESRGAN Linux build | di-download otomatis oleh `setup-linux.sh` ke `bin/` |
| 📄 `topdf` (docx/xlsx/pptx → pdf) | LibreOffice | `sudo apt install libreoffice` |
| 📑 `todocx`, `toexcel`, `topptx` | Python3 + poppler-utils + lib pip | `sudo apt install python3 python3-pip poppler-utils` lalu `pip3 install --break-system-packages pdf2docx pdf2image python-pptx openpyxl pdfplumber` |
| ✂️ `removebg` | @imgly/background-removal-node (murni Node, tanpa binary tambahan) | otomatis lewat `npm install` |
| 🔤 `ocr` | tesseract.js (murni Node/WASM) | otomatis lewat `npm install` |

> 💡 Semua sudah otomatis dicek/dipasang oleh `scripts/setup-linux.sh`, kecuali kalau kamu jalan di distro non-Debian (CentOS/Fedora/Arch): tinggal ganti `apt install` di script itu jadi `dnf install` / `pacman -S` sesuai package manager distro kamu, nama paketnya biasanya sama persis.
