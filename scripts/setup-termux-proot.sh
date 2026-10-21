#!/usr/bin/env bash
# ==============================================================================
# setup-termux-proot.sh : Setup HekaTools di Termux + proot-distro (Android)
# Support Ubuntu MAUPUN Debian -- script ini otomatis deteksi distro yang dipakai.
#
# PRASYARAT (dijalankan di TERMUX, BUKAN di dalam proot):
#   pkg update && pkg upgrade -y
#   pkg install -y proot-distro
#   proot-distro install ubuntu   # ATAU: proot-distro install debian
#   proot-distro login ubuntu     # ATAU: proot-distro login debian
#
# Setelah masuk ke dalam Ubuntu (prompt jadi root@localhost di dalam proot),
# clone/copy folder hekabot ke sana, lalu jalankan script ini DARI DALAM proot:
#   cd hekabot
#   chmod +x scripts/setup-termux-proot.sh
#   ./scripts/setup-termux-proot.sh
#
# CATATAN:
#   - Tidak install LibreOffice (berat, opsional). Kalau HP kamu kuat & mau
#     fitur `topdf`, install manual: apt install -y libreoffice
#   - Tidak install Real-ESRGAN: butuh Vulkan yg biasanya gak ke-expose ke
#     proot. Kalau mau coba tetap, jalankan scripts/setup-linux.sh biasa,
#     tapi kemungkinan besar `.hdr` tetap gagal karena GPU gak diakses.
#   - Pakai pm2 buat "service", BUKAN systemd: proot gak jalanin init system.
# ==============================================================================
set -euo pipefail

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> [1/6] Update apt & install tool dasar + build tools (buat native module Node)..."
apt update
apt install -y \
  curl wget unzip git \
  build-essential python3 python3-pip \
  ffmpeg poppler-utils \
  ca-certificates \
  fontconfig fonts-liberation fonts-noto-color-emoji software-properties-common

echo "==> [1b/6] Install font Microsoft asli (Arial, Arial Black, Impact, dst)..."
echo "    Dipakai fitur .brat (butuh 'Arial Narrow'/Arial) dan .smeme (butuh 'Impact'/'Arial Black')."
echo "    Tanpa ini di Termux proot: .brat gagal render teks sama sekali (diam-diam, gak ada error)"
echo "    dan .smeme jatuh ke fallback font tipis biasa, bukan Impact yang tebal seperti di PC."

# Paket "ttf-mscorefonts-installer" ada di repo NON-FREE, tapi NAMA KOMPONEN repo-nya beda
# antara Ubuntu dan Debian -- Ubuntu pakai "multiverse", Debian pakai "contrib non-free" (+
# "non-free-firmware" khusus Debian 12/bookworm ke atas). Salah pakai nama komponen bikin
# apt gak nemu paketnya sama sekali. Makanya di sini distro-nya dideteksi dulu dari
# /etc/os-release, baru dipilih cara yang bener sesuai distro-nya.
DISTRO_ID="$(. /etc/os-release 2>/dev/null; echo "${ID:-unknown}")"

if [ "$DISTRO_ID" = "ubuntu" ]; then
  add-apt-repository multiverse -y 2>/dev/null || echo "    (repo multiverse mungkin udah ada / sources.list image ini beda, lanjut aja)"
elif [ "$DISTRO_ID" = "debian" ]; then
  echo "    Terdeteksi Debian (bukan Ubuntu) -- pakai komponen 'contrib non-free', bukan 'multiverse'."
  # Nambahin "contrib non-free non-free-firmware" ke tiap baris "deb ..." di sources.list yang
  # belum punya komponen itu (regex jaga-jaga biar gak dobel nambahin kalau udah ada).
  # "non-free-firmware" baru ada mulai Debian 12/bookworm -- di Debian versi lebih lama komponen
  # itu gak dikenal apt, makanya dicoba dulu SAMA "non-free-firmware", kalau apt update-nya
  # gagal baru dicoba ulang TANPA "non-free-firmware" (buat Debian 10/11).
  cp /etc/apt/sources.list /etc/apt/sources.list.bak-hekabot 2>/dev/null || true
  sed -i -E '/^deb /{/contrib/! s/$/ contrib non-free non-free-firmware/}' /etc/apt/sources.list
  if ! apt update 2>/dev/null; then
    echo "    (\"non-free-firmware\" kemungkinan gak dikenal di versi Debian ini, coba tanpa itu...)"
    [ -f /etc/apt/sources.list.bak-hekabot ] && cp /etc/apt/sources.list.bak-hekabot /etc/apt/sources.list
    sed -i -E '/^deb /{/contrib/! s/$/ contrib non-free/}' /etc/apt/sources.list
    apt update
  fi
else
  echo "    Distro '$DISTRO_ID' gak dikenali (bukan Ubuntu/Debian) -- dilewatin, coba install manual"
  echo "    kalau paketnya ada di repo non-free/contrib distro ini dengan nama komponen yang sesuai."
fi

apt update
echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections
if apt install -y ttf-mscorefonts-installer; then
  fc-cache -f -v > /dev/null
  echo "    OK -- font Microsoft ke-install & fc-cache di-refresh."
else
  echo "    GAGAL install ttf-mscorefonts-installer (perlu koneksi internet stabil, filenya lumayan"
  echo "    besar & didownload langsung dari server Microsoft/Sourceforge, bukan dari apt cache)."
  echo "    .brat/.smeme TETAP bisa dipakai pakai font fallback (Liberation Sans) kalau ini gagal."
fi

echo "==> [2/6] Cek/Install Node.js 18+..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "==> [3/6] Install yt-dlp..."
pip3 install --break-system-packages -U yt-dlp

echo "==> [4/6] Install library Python buat convert PDF (todocx, toexcel, topptx)..."
pip3 install --break-system-packages -U pdf2docx pdf2image python-pptx openpyxl pdfplumber

echo "==> [5/6] npm install (native module kayak sharp/@napi-rs/canvas akan build dari source"
echo "    kalau gak ada prebuilt binary buat arch HP kamu, ini WAJAR makan waktu lebih lama)..."
cd "$BOT_DIR"
if [ -d "$BOT_DIR/node_modules/@napi-rs/canvas-win32-x64-msvc" ] || [ -d "$BOT_DIR/node_modules/sharp/vendor/8.14.5/win32-x64" ]; then
  echo "    ⚠️ Terdeteksi node_modules bekas Windows! Membersihkan agar ter-install native versi Linux/ARM..."
  rm -rf "$BOT_DIR/node_modules" "$BOT_DIR/package-lock.json"
fi
npm install --include=optional

echo "==> [6/6] Install pm2 (pengganti systemd, karena proot gak jalanin init system)..."
npm install -g pm2

echo ""
echo "==> Cek versi tool:"
echo "  node    : $(node -v 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  ffmpeg  : $(ffmpeg -version 2>/dev/null | head -n1 || echo 'TIDAK KETEMU')"
echo "  yt-dlp  : $(yt-dlp --version 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  python3 : $(python3 --version 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  pm2     : $(pm2 -v 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  font Impact/Arial : $(fc-list 2>/dev/null | grep -qi impact && echo 'OK (dipakai .brat/.smeme)' || echo 'TIDAK KETEMU (dipakai .brat/.smeme -- cek pesan error di atas)')"

cat <<'EOF'

==================================================================
 Setup selesai. Langkah selanjutnya:

 1. Test jalan server:
      npm start
    Lalu buka browser di HP: http://localhost:3000

 2. Jalankan sebagai proses background pakai pm2:
      pm2 start server.js --name hekatools
      pm2 save
      pm2 logs hekatools

 3. PENTING: biar Android gak matiin proses Termux di background:
    - Buka app Termux (di luar proot), jalankan sekali:
        termux-wake-lock
    - Di pengaturan Android: matikan Battery Optimization khusus
      buat app Termux (biasanya di Settings > Apps > Termux > Battery
      > Unrestricted).
    - Install Termux:Boot (dari F-Droid) kalau mau HekaTools auto-start
      lagi tiap HP di-restart.

 4. Untuk akses dari laptop atau perangkat lain di WiFi yang sama:
    - Cek IP HP kamu (contoh: 192.168.1.50)
    - Buka di browser laptop: http://192.168.1.50:3000
==================================================================
EOF
