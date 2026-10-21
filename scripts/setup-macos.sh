#!/usr/bin/env bash
# ==============================================================================
# setup-macos.sh : Setup HekaTools di macOS (pakai Homebrew)
#
# Cara pakai:
#   cd hekabot
#   chmod +x scripts/setup-macos.sh
#   ./scripts/setup-macos.sh
# ==============================================================================
set -euo pipefail

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$BOT_DIR/bin"
mkdir -p "$BIN_DIR"

echo "==> [1/6] Cek Homebrew..."
if ! command -v brew >/dev/null 2>&1; then
  echo "    Homebrew belum ke-install. Install dulu (ikuti instruksi di layar):"
  echo '    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

echo "==> [2/6] Install Node.js, ffmpeg, python3, poppler, libreoffice via brew..."
brew install node ffmpeg python3 poppler --quiet
echo "    (LibreOffice via brew cask, opsional -- untuk fitur topdf)"
brew install --cask libreoffice --quiet || echo "    Skip LibreOffice (opsional, gak fatal kalau gagal)"

echo "==> [3/6] Install yt-dlp..."
pip3 install -U yt-dlp

echo "==> [4/6] Install library Python buat convert PDF (todocx, toexcel, topptx)..."
pip3 install -U pdf2docx pdf2image python-pptx openpyxl pdfplumber

echo "==> [5/6] Download Real-ESRGAN (macOS build, untuk fitur .hdr, opsional)..."
if [ ! -f "$BIN_DIR/realesrgan-ncnn-vulkan" ]; then
  TMP_ZIP="/tmp/realesrgan-macos.zip"
  RELEASE_URL="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-macos.zip"
  if curl -fsSL -o "$TMP_ZIP" "$RELEASE_URL"; then
    unzip -o "$TMP_ZIP" -d "$BIN_DIR"
    chmod +x "$BIN_DIR/realesrgan-ncnn-vulkan"
    rm -f "$TMP_ZIP"
    echo "    OK -> $BIN_DIR/realesrgan-ncnn-vulkan"
    echo "    Catatan: macOS bisa nge-block binary yang gak sign/notarized. Kalau muncul"
    echo "    peringatan 'cannot be opened', buka System Settings > Privacy & Security >"
    echo "    klik 'Allow Anyway', ATAU jalankan: xattr -d com.apple.quarantine \"$BIN_DIR/realesrgan-ncnn-vulkan\""
  else
    echo "    GAGAL download otomatis. Kalau mau fitur .hdr jalan lokal (bukan cuma via"
    echo "    fallback PicsArt online), download manual dari:"
    echo "    https://github.com/xinntao/Real-ESRGAN/releases (pilih file '-macos.zip')"
  fi
else
  echo "    Sudah ada di $BIN_DIR/realesrgan-ncnn-vulkan, dilewati."
fi

echo "==> [6/6] npm install dependency Node.js..."
cd "$BOT_DIR"
npm install

echo ""
echo "==> Cek versi tool:"
echo "  node       : $(node -v 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  ffmpeg     : $(ffmpeg -version 2>/dev/null | head -n1 || echo 'TIDAK KETEMU')"
echo "  yt-dlp     : $(yt-dlp --version 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  python3    : $(python3 --version 2>/dev/null || echo 'TIDAK KETEMU')"
echo "  soffice    : $(soffice --version 2>/dev/null | head -n1 || echo 'TIDAK KETEMU (opsional, fitur topdf saja)')"
echo "  realesrgan : $([ -f "$BIN_DIR/realesrgan-ncnn-vulkan" ] && echo 'OK di bin/' || echo 'TIDAK ADA (opsional, hdr tetap jalan via fallback PicsArt online)')"

cat <<'EOF'

==================================================================
 Setup selesai. Jalankan bot dengan:
   npm start

 Supaya bot jalan terus-menerus di background, pakai pm2:
   npm install -g pm2
   pm2 start index.js --name hekabot
   pm2 save
   pm2 logs hekabot
==================================================================
EOF
