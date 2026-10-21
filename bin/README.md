# 🧰 `bin/` — Binary Eksternal Lokal

Folder ini **sengaja dikosongkan** di repo (isinya di-`.gitignore`) — tempat kamu taruh binary/executable eksternal yang dibutuhkan sebagian fitur bot.

## 🔍 Kenapa folder ini penting?

Lihat `lib/binaries.js` — saat bot butuh sebuah binary (`ffmpeg`, `yt-dlp`, `soffice`, `realesrgan-ncnn-vulkan`), urutan pencariannya:

1. 📁 **Folder `bin/` ini dulu** (paling diprioritaskan — gak perlu install apapun ke sistem)
2. 🖥️ Lokasi instalasi default yang umum dipakai installer resmi (misal LibreOffice)
3. 🌐 Fallback ke `PATH` sistem (asumsi sudah di-install & terdaftar)

Artinya: kalau kamu taruh binary-nya di sini, **kamu gak perlu edit Environment Variables/PATH sistem sama sekali** — bot langsung nemu duluan dari folder ini. Ini paling berguna di **Windows** (gak punya package manager standar) dan situasi lain di mana install ke sistem ribet/gak memungkinkan.

## 📦 Apa saja yang bisa ditaruh di sini?

| File | Dipakai untuk | Wajib? |
|---|---|---|
| `ffmpeg` / `ffmpeg.exe` + `ffprobe` / `ffprobe.exe` | `.tomp3`, `.tovn`, `.cutmp3`, `.togif`, convert audio yt-dlp | ✅ Sangat disarankan |
| `yt-dlp` / `yt-dlp.exe` | `.ytmp3`, `.ytmp4`, `.play`, `.fbdl`, `.igdl`, dan puluhan downloader lain | ✅ Sangat disarankan |
| `realesrgan-ncnn-vulkan` / `.exe` + folder `models/` di sebelahnya | `.hdr` (upscale gambar AI lokal) | ⭕ Opsional — ada fallback online (PicsArt) kalau gak ada |
| `poppler/` (isi folder `Library\bin` dari poppler-windows) | `.todocx`, `.toexcel`, `.topptx` (khusus Windows) | ⭕ Opsional di Windows saja (Linux/macOS pakai package manager) |

> 💡 Kalau kamu pakai script setup otomatis (`scripts/setup-linux.sh`, `scripts/setup-macos.sh`, `scripts/setup-termux-proot.sh`), sebagian besar binary di atas **sudah otomatis di-download/di-install** — folder ini bisa jadi terisi otomatis (khususnya Real-ESRGAN) atau dependency-nya langsung ke sistem (ffmpeg/yt-dlp via package manager, jadi gak perlu di folder ini juga bisa jalan).

## 🪟 Contoh khusus Windows (paling sering butuh folder ini)

```
bin/
├── ffmpeg.exe
├── ffprobe.exe
├── yt-dlp.exe
├── realesrgan-ncnn-vulkan.exe
├── models/              ← WAJIB ikut kalau pakai Real-ESRGAN, jangan cuma binary-nya
│   └── ...
└── poppler/
    └── pdftoppm.exe
    └── ...
```

## ⚠️ Catatan

- File di folder ini **tidak ikut ke-commit ke git** (lihat `.gitignore`) — kalau kamu clone ulang/deploy ke server baru, folder ini kosong lagi dan perlu diisi ulang (atau jalankan ulang script setup).
- Kalau binary tertentu gak ada di sini **dan** gak ada di lokasi default **dan** gak ada di PATH sistem, fitur yang membutuhkannya akan gagal dengan pesan error yang menjelaskan cara pasangnya — bukan silent fail.
- Detail lengkap cara install tiap binary (semua OS) ada di [`README.md`](../README.md) bagian **1a. Instalasi Manual**.
