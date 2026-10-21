# 🎨 `assets/` — Aset Visual Bot

Folder ini isinya **font** dan **gambar** yang dipakai fitur-fitur bot yang menggambar/mengedit gambar (sticker, canvas text, menu).

## 📁 Isi folder

```
assets/
├── fonts/               ← font kustom (termasuk font emoji) buat fitur canvas/sticker
├── banner_menu.jpg        ← (opsional) gambar pembuka waktu ada yang kirim .menu
├── banner_intro.jpg        ← (opsional) gambar salam member baru masuk grup
└── banner_out.jpg           ← (opsional) gambar salam perpisahan member keluar grup
```

## 🔤 `assets/fonts/`

Dibaca otomatis oleh `lib/fontRegistry.js` setiap bot start — semua file `.ttf`/`.otf`/`.ttc` di folder ini (termasuk di subfolder) di-scan dan didaftarkan ke sistem rendering canvas (`@napi-rs/canvas`, dipakai fitur `.brat`, `.smeme`, `.qc`, `.squote`, `.swm`).

**Dipakai untuk:**
- `.brat` (`lib/bratCanvas.js`) — butuh font `Arial Narrow` / `Arial`
- `.smeme` (`lib/textImage.js`) — butuh font `Impact` / `Arial Black`
- Rendering emoji **bergambar** (bukan kotak/tofu) di semua fitur canvas di atas

### 😀 Soal font emoji — PENTING

> ⚠️ File font emoji **wajib** namanya mengandung kata **"emoji"** (huruf besar/kecil bebas — contoh: `NotoColorEmoji.ttf`) supaya kedetect otomatis.

Kenapa harus begitu? Kalau kamu taruh font emoji tapi namanya gak mengandung "emoji", bot bisa diam-diam pakai font emoji **bawaan OS** (Segoe UI Emoji di Windows, Apple Color Emoji di Mac) alih-alih font yang kamu taruh sendiri — karena beberapa OS auto-detect font emoji sistemnya duluan. Font yang namanya mengandung "emoji" didaftarkan dengan **alias tetap** (`HekaBratEmoji`) supaya bot **selalu** pakai file yang kamu taruh sendiri di sini, apapun OS-nya.

### 🔁 Cara ganti/tambah font emoji

1. Download font emoji yang kamu punya izin pakai (misal [Noto Color Emoji](https://github.com/googlefonts/noto-emoji), gratis & open-source)
2. Taruh/timpa file yang namanya mengandung "emoji" di folder ini
3. Restart bot — otomatis ke-load ulang, **gak perlu ubah kode apa pun**

### 🐧 Khusus Linux/Termux — font Microsoft (Arial, Impact) tidak bawaan

Font Windows/macOS seperti `Arial`, `Arial Black`, `Impact` **tidak ada secara default** di Linux/Ubuntu/Termux. Kalau kamu pakai script setup otomatis (`scripts/setup-linux.sh` / `scripts/setup-termux-proot.sh`), ini **sudah otomatis dipasang** lewat paket `ttf-mscorefonts-installer`. Kalau install manual, lihat bagian troubleshooting di [`README.md`](../README.md) (cari "font Microsoft").

> 💡 Kalau folder `assets/fonts/` kosong sama sekali, bot **tetap jalan normal** — cuma emoji di gambar hasil `.brat`/`.smeme`/dll bakal tampil kotak (□) alih-alih gambar berwarna. Bot otomatis membuat folder ini kalau belum ada, dan tetap kasih tahu di log kalau font emoji belum ketemu.

## 🖼️ Banner (opsional, kamu tambahkan sendiri)

Ditampilkan sebagai gambar oleh `lib/banner.js` di 3 momen berbeda. **File-file ini tidak disertakan di repo** — kamu tambahkan sendiri kalau mau, semuanya opsional (bot tetap jalan normal tanpanya, cuma skip bagian gambar).

| Nama file (base) | Dikirim saat | Dipanggil dari |
|---|---|---|
| `banner_menu` | Ada yang kirim `.menu` | `handler.js` |
| `banner_intro` | Member baru masuk grup (salam sambutan) | `lib/groupEvents.js` |
| `banner_out` | Member keluar grup (salam perpisahan) | `lib/groupEvents.js` |

Tiap nama base bisa pakai extension: `.jpg`, `.jpeg`, `.png`, atau `.webp` — cukup salah satu (contoh: `banner_menu.png` sudah cukup, gak perlu keempat-empatnya sekaligus).
