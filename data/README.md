# 💾 `data/` — Data Persisten Bot

Folder ini isinya **file-file data yang harus bertahan** meski bot di-restart (`Ctrl+C` → `npm start` lagi, laptop mati-nyala, atau server reboot). Semua file di sini dibuat **otomatis** oleh bot saat dibutuhkan — kamu gak perlu bikin manual, kecuali `cookies.txt` (opsional, lihat di bawah).

> ⚠️ Folder & isinya **tidak ikut ke-commit ke git** (lihat `.gitignore`) — sengaja, karena isinya data pribadi user & sesi login. Kalau kamu deploy ke server baru, folder ini mulai kosong lagi (bot bikin ulang otomatis).

## 📁 Isi folder

| File | Dibuat oleh | Isinya |
|---|---|---|
| `users.json` | `lib/userStore.js` | 👤 Data user yang sudah `.daftar` (nama, nomor, tanggal daftar) |
| `gamestats.json` | `lib/gameStats.js` | 🏆 Statistik kemenangan game per-user (buat `.profil`) |
| `cookies.txt` | **Kamu sendiri** (manual, opsional) | 🍪 Cookies login Instagram/TikTok, buat downloader yang butuh login |

## 👤 `users.json` — Data Pendaftaran User

Diisi otomatis setiap ada yang `.daftar`, dihapus otomatis kalau ada yang `.hapusakun`/di-`.deleteuser` owner. Selama file ini **tidak dihapus manual**, data user aman biar bot restart berkali-kali pun.

Mau lihat isinya? Command `.database` (khusus owner) menampilkan listing lengkap semua user terdaftar dari file ini.

## 🏆 `gamestats.json` — Statistik Kemenangan Game

Nyimpen berapa kali tiap user menang di menu Game (`minesweeper`, `susunkata`, `tebakbendera`, dst). Ditampilkan lewat `.profil`.

## 🍪 `cookies.txt` — Cookies Login (opsional, buat downloader Instagram/TikTok)

**Kamu isi manual** kalau `.igdl`/`.igslide`/downloader Instagram lain mulai gagal terus dengan error semacam `"No video formats found"` — ini bukan bug bot, tapi pembatasan resmi Instagram/TikTok yang makin sering menolak request tanpa login (lihat detail lengkap & cara export cookies di [`README.md`](../README.md) bagian troubleshooting downloader).

Ringkasnya:
1. Login ke Instagram/TikTok di browser biasa
2. Export cookies pakai extension **"Get cookies.txt LOCALLY"**
3. Rename jadi `cookies.txt`, taruh persis di folder ini (`data/cookies.txt`)
4. Restart bot — otomatis kedetect & dipakai buat semua request `yt-dlp`

> 🔐 **PENTING soal keamanan**: file ini isinya sesi login akun asli kamu — siapapun yang pegang file ini bisa login sebagai akun kamu. **Jangan pernah share file ini ke siapapun**, dan jangan upload ke repo git publik manapun (folder `data/` sudah otomatis di-`.gitignore`, tapi tetap hati-hati kalau kamu kelola repo secara manual).

## 🗑️ Mau reset semua data?

Hapus file yang bersangkutan (atau seluruh folder `data/`) lalu restart bot — file/folder akan dibuat ulang otomatis dari kosong. **Ini permanen**, gak ada cara membatalkannya kalau belum di-backup.
