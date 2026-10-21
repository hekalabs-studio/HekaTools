import sys
from pdf2image import convert_from_path
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
_POPPLER_BIN = os.path.join(PROJECT_ROOT, "bin", "poppler")
if sys.platform == "win32" and os.path.isfile(os.path.join(_POPPLER_BIN, "pdftoppm.exe")):
    POPPLER_PATH = _POPPLER_BIN
elif sys.platform != "win32" and os.path.isfile(os.path.join(_POPPLER_BIN, "pdftoppm")):
    POPPLER_PATH = _POPPLER_BIN
else:
    POPPLER_PATH = None

def main():
    input_path, output_path = sys.argv[1], sys.argv[2]
    images = convert_from_path(input_path, dpi=150, poppler_path=POPPLER_PATH)
    if not images:
        raise RuntimeError("PDF tidak punya halaman untuk dikonversi.")
    images[0].save(output_path, "PNG")

if __name__ == "__main__":
    main()
