#!/usr/bin/env bash
# ==============================================================================
# setup-linux.sh : Setup HekaTools 100% di Linux (Ubuntu/Debian/VPS), tanpa Windows.
#
# Cara pakai:
#   cd hekabot
#   chmod +x scripts/setup-linux.sh
#   ./scripts/setup-linux.sh
#
# Script ini akan:
#   1. Install ffmpeg, python3, poppler-utils, libreoffice, font Microsoft via apt
#   2. Cek/Install Node.js 18+ (via NodeSource) kalau belum ada/versi lama
#   3. Install yt-dlp via pip (lebih gampang di-update daripada apt)
#   4. Install library python buat convert PDF (pdf2docx, pdf2image, dst)
#   5. Download Real-ESRGAN versi Linux (untuk fitur .hdr) ke folder bin/
#   6. npm install dependency Node.js
# ==============================================================================
set -euo pipefail

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$BOT_DIR/bin"
mkdir -p "$BIN_DIR"

echo "==> [1/7] Update apt & install ffmpeg, python3, poppler, libreoffice, build tools, dan fonts..."
sudo apt update
sudo apt install -y \
  ffmpeg \
  python3 \
  python3-pip \
  poppler-utils \
  libreoffice \
  unzip \
  wget \
  curl \
  ca-certificates \
  build-essential \
  fontconfig \
  fonts-liberation \
  fonts-noto-color-emoji \
  software-properties-common

echo "==> [1b/7] Install font Microsoft asli (Arial, Arial Black, Impact, dst)..."
echo "    Dipakai fitur .brat (butuh 'Arial Narrow'/Arial) dan .smeme (butuh 'Impact'/'Arial Black')."
echo "    Tanpa ini, .brat bisa gagal render teks sama sekali (canvas gak nemu fontnya, diam-diam"
echo "    gagal tanpa error) dan .smeme jatuh ke fallback font tipis biasa, bukan Impact yang tebal."

# Paket "ttf-mscorefonts-installer" ada di repo NON-FREE, tapi NAMA KOMPONEN repo-nya beda
# antara Ubuntu dan Debian -- Ubuntu pakai "multiverse", Debian pakai "contrib non-free" (+
# "non-free-firmware" khusus Debian 12/bookworm ke atas). Distro-nya dideteksi dulu dari
# /etc/os-release, baru dipilih cara yang bener sesuai distro-nya (salah pakai nama komponen
# bikin apt gak nemu paketnya sama sekali).
DISTRO_ID="$(. /etc/os-release 2>/dev/null; echo "${ID:-unknown}")"

if [ "$DISTRO_ID" = "ubuntu" ]; then
  sudo add-apt-repository multiverse -y
elif [ "$DISTRO_ID" = "debian" ]; then
  echo "    Terdeteksi Debian (bukan Ubuntu) -- pakai komponen 'contrib non-free', bukan 'multiverse'."
  sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak-hekabot 2>/dev/null || true
  sudo sed -i -E '/^deb /{/contrib/! s/$/ contrib non-free non-free-firmware/}' /etc/apt/sources.list
  if ! sudo apt update 2>/dev/null; then
    echo "    (\"non-free-firmware\" kemungkinan gak dikenal di versi Debian ini, coba tanpa itu...)"
    [ -f /etc/apt/sources.list.bak-hekabot ] && sudo cp /etc/apt/sources.list.bak-hekabot /etc/apt/sources.list
    sudo sed -i -E '/^deb /{/contrib/! s/$/ contrib non-free/}' /etc/apt/sources.list
  fi
else
  echo "    Distro '$DISTRO_ID' gak dikenali (bukan Ubuntu/Debian) -- dilewatin, coba install manual"
  echo "    kalau paketnya ada di repo non-free/contrib distro ini dengan nama komponen yang sesuai."
fi

sudo apt update
# Auto-setujui EULA Microsoft biar gak ngegantung nunggu prompt interaktif di tengah script
echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | sudo debconf-set-selections
if sudo apt install -y ttf-mscorefonts-installer; then
  sudo fc-cache -f -v > /dev/null
  echo "    OK -- font Microsoft ke-install & fc-cache di-refresh."
else
  echo "    GAGAL install ttf-mscorefonts-installer (butuh koneksi stabil ke internet, downloadnya"
  echo "    dari server Microsoft/Sourceforge langsung, bukan dari apt cache biasa)."
  echo "    .brat/.smeme TETAP bisa dipakai tapi hasilnya pakai font fallback (Liberation Sans),"
  echo "    bukan Arial/Impact asli. Coba jalankan manual nanti kalau koneksi udah stabil:"
  echo "      sudo apt install -y ttf-mscorefonts-installer && sudo fc-cache -f -v"
fi

echo "==> [2/7] Cek/Install Node.js 18+..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
  sudo apt install -y nodejs
else
  echo "    Sudah ada Node.js $(node -v), dilewati."
fi

echo "==> [3/7] Install yt-dlp (via pip, versi selalu terbaru)..."
pip3 install --break-system-packages -U yt-dlp

echo "==> [4/7] Install library Python untuk convert PDF (todocx, toexcel, topptx)..."
pip3 install --break-system-packages -U pdf2docx pdf2image python-pptx openpyxl pdfplumber

echo "==> [5/7] Download Real-ESRGAN (Linux build, untuk fitur .hdr)..."
if [ ! -f "$BIN_DIR/realesrgan-ncnn-vulkan" ]; then
  TMP_ZIP="/tmp/realesrgan-linux.zip"
  RELEASE_URL="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip"
  echo "    Mengunduh dari $RELEASE_URL ..."
  if wget -q -O "$TMP_ZIP" "$RELEASE_URL"; then
    unzip -o "$TMP_ZIP" -d "$BIN_DIR"
    chmod +x "$BIN_DIR/realesrgan-ncnn-vulkan"
    rm -f "$TMP_ZIP"
    echo "    OK -> $BIN_DIR/realesrgan-ncnn-vulkan"
  else
    echo "    GAGAL download otomatis (link release mungkin berubah)."
    echo "    Download manual dari: https://github.com/xinntao/Real-ESRGAN/releases"
    echo "    Pilih file '-ubuntu.zip', extract, taruh isinya (binary + folder models/) ke: $BIN_DIR"
  fi
else
  echo "    Sudah ada di $BIN_DIR/realesrgan-ncnn-vulkan, dilewati."
fi

echo "==> [6/7] npm install dependency Node.js..."
cd "$BOT_DIR"
# Kalau folder node_modules sebelumnya di-copy dari Windows (berisi binary win32),
# hapus dulu agar npm mengunduh binary native Linux (ELF) yang sesuai arsitektur.
if [ -d "$BOT_DIR/node_modules/@napi-rs/canvas-win32-x64-msvc" ] || [ -d "$BOT_DIR/node_modules/sharp/vendor/8.14.5/win32-x64" ]; then
  echo "    ⚠️ Terdeteksi node_modules bekas Windows! Membersihkan agar ter-install native versi Linux..."
  rm -rf "$BOT_DIR/node_modules" "$BOT_DIR/package-lock.json"
fi
npm install --include=optional

echo "==> [7/7] Cek versi tool yang ke-install..."
echo "  node       : $(node -v 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  npm        : $(npm -v 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  ffmpeg     : $(ffmpeg -version 2>/dev/null | head -n1 || echo 'TIDAK KETEMU')"
echo "  yt-dlp     : $(yt-dlp --version 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  python3    : $(python3 --version 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  soffice    : $(soffice --version 2>/dev/null | head -n1 || echo 'TIDAK KETEMU')"
echo "  realesrgan : $([ -f "$BIN_DIR/realesrgan-ncnn-vulkan" ] && echo 'OK di bin/' || echo 'TIDAK KETEMU (opsional, fitur .hdr saja)')"
echo "  font Impact/Arial : $(fc-list 2>/dev/null | grep -qi impact && echo 'OK (dipakai .brat/.smeme)' || echo 'TIDAK KETEMU (dipakai .brat/.smeme -- cek pesan error di atas)')"

echo ""
echo "=================================================================="
echo " Setup selesai. Jalankan bot dengan:"
echo "   npm start"
echo ""
echo " Supaya bot jalan TERUS-MENERUS di background (auto-restart kalau"
echo " crash, auto-start kalau server reboot) tanpa perlu terminal terbuka,"
echo " pakai systemd service. Lihat: scripts/hekabot.service"
echo "=================================================================="
