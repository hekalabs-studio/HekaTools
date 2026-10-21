/**
 * HekaTools Web - Client-side Application Logic
 * Menangani interaksi UI, pencarian, filter kategori, dark mode, dan API calls untuk semua 13 studio.
 */

// Data Katalog Alat Serbaguna - Setiap alat memiliki Studio Modal tersendiri
const TOOLS_CATALOG = [
  // Downloader Video & Media Studio (All-in-One Social Media Downloader)
  {
    id: "media-downloader",
    name: "Downloader Video & Media",
    desc: "Unduh video & audio tanpa watermark dari TikTok, YouTube, Instagram, Facebook, CapCut, dan Pinterest dalam satu tempat.",
    category: "downloader",
    icon: "📥",
    iconClass: "icon-rose",
    badge: "All-in-One",
    badgeClass: "badge-mint",
    action: "openDownloaderModal",
  },

  // Stiker & Media Studio
  {
    id: "brat-maker",
    name: "Brat Sticker Studio",
    desc: "Buat gambar & stiker WhatsApp ala album Brat dengan 10 varian warna solid cerah.",
    category: "sticker",
    icon: "🟢",
    iconClass: "icon-mint",
    badge: "Viral",
    badgeClass: "badge-amber",
    action: "openBratModal",
  },
  {
    id: "remove-bg",
    name: "Hapus Latar Belakang (AI)",
    desc: "Hapus background gambar secara otomatis menggunakan kecerdasan buatan dalam sekejap.",
    category: "sticker",
    icon: "✂️",
    iconClass: "icon-rose",
    badge: "AI Tool",
    badgeClass: "badge-violet",
    action: "openRemoveBgModal",
  },
  {
    id: "brat-video",
    name: "Brat Video Animasi MP4",
    desc: "Buat video animasi Brat estetik berkedip kata-demi-kata berformat MP4 secara instan.",
    category: "sticker",
    icon: "🎬",
    iconClass: "icon-mint",
    badge: "Animasi MP4",
    badgeClass: "badge-mint",
    action: "openBratVideoModal",
  },
  {
    id: "quote-chat",
    name: "Quote Chat Maker (QC)",
    desc: "Ubah teks kutipan menjadi gelembung pesan chat WhatsApp estetik dengan foto profil.",
    category: "sticker",
    icon: "💬",
    iconClass: "icon-blue",
    badge: "Gelembung Chat",
    badgeClass: "badge-blue",
    action: "openQuoteChatModal",
  },
  {
    id: "hdr-upscale",
    name: "Penjernih Foto HD (HDR)",
    desc: "Jernihkan foto buram/pecah menjadi resolusi tinggi super tajam menggunakan Real-ESRGAN AI.",
    category: "sticker",
    icon: "✨",
    iconClass: "icon-violet",
    badge: "Real-ESRGAN",
    badgeClass: "badge-violet",
    action: "openHdrModal",
  },
  {
    id: "recolor-photo",
    name: "Pewarna Foto Jadul (Recolor)",
    desc: "Beri warna realistis pada foto hitam-putih lawas secara otomatis dengan AI Colorization.",
    category: "sticker",
    icon: "🎨",
    iconClass: "icon-amber",
    badge: "Colorize AI",
    badgeClass: "badge-amber",
    action: "openRecolorModal",
  },
  {
    id: "sticker-maker",
    name: "WhatsApp Sticker Maker (SWM)",
    desc: "Ubah foto apa saja menjadi stiker WhatsApp WebP resmi lengkap dengan nama pack dan author EXIF.",
    category: "sticker",
    icon: "🏷️",
    iconClass: "icon-mint",
    badge: "WebP + EXIF",
    badgeClass: "badge-mint",
    action: "openStickerMakerModal",
  },

  // AI Workspace
  {
    id: "ai-chat",
    name: "Mode AI Google (Serba Tahu)",
    desc: "Obrolan cerdas serba tahu dengan bubble chat responsif ditenagai Google Gemini & Groq Llama 3.3.",
    category: "ai",
    icon: "✨",
    iconClass: "icon-blue",
    badge: "Serba Tahu",
    badgeClass: "badge-amber",
    action: "openAiModal",
  },

  // Converter Studio
  {
    id: "converter-file",
    name: "Converter File",
    desc: "Konversi file serbaguna antar format: PDF, Word (DOCX), Excel (XLSX), PPTX, dan Gambar (JPG/PNG).",
    category: "converter",
    icon: "📑",
    iconClass: "icon-violet",
    badge: "All-in-One",
    badgeClass: "badge-mint",
    action: "openConverterFileModal",
  },
  {
    id: "video-audio-converter",
    name: "Video to Voice Note (VN)",
    desc: "Ubah sembarang video atau audio menjadi voice note WhatsApp asli dengan codec Opus.",
    category: "converter",
    icon: "🎙️",
    iconClass: "icon-mint",
    badge: "Opus Codec",
    badgeClass: "badge-mint",
    action: "openConverterModal",
  },

  // Utilitas
  {
    id: "ocr-scanner",
    name: "OCR Scanner Teks",
    desc: "Ekstrak teks bahasa Indonesia dan Inggris langsung dari gambar atau tangkapan layar.",
    category: "utilities",
    icon: "🔍",
    iconClass: "icon-blue",
    badge: "Tesseract",
    badgeClass: "badge-amber",
    action: "openOcrModal",
  },
  {
    id: "cek-pln",
    name: "Cek Tagihan Listrik PLN",
    desc: "Periksa informasi rincian tagihan listrik pascabayar PLN resmi secara langsung.",
    category: "utilities",
    icon: "⚡",
    iconClass: "icon-amber",
    badge: "Live Data",
    badgeClass: "badge-mint",
    action: "openPlnModal",
  },
  {
    id: "ai-image-gen",
    name: "AI Image Generator (Text-to-Image)",
    desc: "Buat karya gambar, seni digital, dan ilustrasi fotorealistis dari teks deskripsi prompt ditenagai AI FLUX.",
    category: "ai",
    icon: "🎨",
    iconClass: "icon-violet",
    badge: "FLUX AI",
    badgeClass: "badge-violet",
    action: "openImageGenModal",
  },
  {
    id: "qr-studio",
    name: "QR Code Studio & Scanner",
    desc: "Buat QR Code kustom untuk URL, teks, akses WiFi, atau WhatsApp, serta scan QR Code dari foto.",
    category: "utilities",
    icon: "📱",
    iconClass: "icon-mint",
    badge: "Generator + Scan",
    badgeClass: "badge-mint",
    action: "openQrStudioModal",
  },
  {
    id: "tts-studio",
    name: "Text-to-Speech Studio (Voice MP3)",
    desc: "Ubah teks tulisan menjadi suara ucapan alami berformat MP3 dalam berbagai bahasa dunia.",
    category: "utilities",
    icon: "🗣️",
    iconClass: "icon-rose",
    badge: "Voice MP3",
    badgeClass: "badge-rose",
    action: "openTtsModal",
  },
  {
    id: "shortlink-studio",
    name: "Shortlink URL Generator",
    desc: "Perpendek tautan URL panjang menjadi ringkas dan mudah dibagikan lengkap dengan QR code otomatis.",
    category: "utilities",
    icon: "🔗",
    iconClass: "icon-blue",
    badge: "Instant Shortener",
    badgeClass: "badge-blue",
    action: "openShortlinkModal",
  },
  {
    id: "religi-hub",
    name: "Portal Religi & Ibadah",
    desc: "Bacaan Al-Qur'an 114 Surah lengkap terjemahan Kemenag, Jadwal Waktu Sholat kota se-Indonesia, dan Alkitab Digital.",
    category: "religi",
    icon: "🕌",
    iconClass: "icon-mint",
    badge: "Al-Qur'an & Doa",
    badgeClass: "badge-mint",
    action: "openReligiModal",
  },
  {
    id: "encyclopedia-hub",
    name: "Kamus KBBI & Ensiklopedia",
    desc: "Definisi resmi kosakata baku bahasa Indonesia dari KBBI serta ringkasan artikel ensiklopedia Wikipedia.",
    category: "informasi",
    icon: "📚",
    iconClass: "icon-blue",
    badge: "KBBI & Wiki",
    badgeClass: "badge-blue",
    action: "openEncyclopediaModal",
  },
  {
    id: "geo-info",
    name: "Cuaca & Kode Pos Indonesia",
    desc: "Informasi prakiraan cuaca kota real-time serta database pencarian kode pos kelurahan se-Indonesia.",
    category: "informasi",
    icon: "⛅",
    iconClass: "icon-amber",
    badge: "BMKG & Pos",
    badgeClass: "badge-amber",
    action: "openGeoInfoModal",
  },
  {
    id: "lyrics-finder",
    name: "Pencari Lirik Lagu",
    desc: "Temukan lirik lagu lokal dan mancanegara secara lengkap dan instan berdasarkan judul lagu atau musisi.",
    category: "utilities",
    icon: "🎵",
    iconClass: "icon-rose",
    badge: "Full Lyrics",
    badgeClass: "badge-rose",
    action: "openLyricsModal",
  },
];

// Helper global: Escape HTML aman untuk atribut & konten DOM
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 3 Seksi Besar Bertingkat (Suites Architecture)
const SUITES = [
  {
    id: "media-suite",
    title: "Media & Downloader Studio",
    tag: "📥 Media Suite",
    tagClass: "suite-tag-rose",
    desc: "Unduh video sosmed tanpa watermark, konversi berkas universal, dan olah audio voice note.",
    toolIds: ["media-downloader", "converter-file", "video-audio-converter", "sticker-maker"]
  },
  {
    id: "ai-suite",
    title: "AI & Creative Studio",
    tag: "✨ AI & Visual",
    tagClass: "suite-tag-violet",
    desc: "Asisten AI serba tahu, generator lukisan AI FLUX, penjernih foto HDR, dan visual estetik.",
    toolIds: ["ai-chat", "ai-image-gen", "hdr-upscale", "recolor-photo", "remove-bg", "brat-maker", "brat-video", "quote-chat"]
  },
  {
    id: "utilities-suite",
    title: "Utilitas, Edukasi & Religi",
    tag: "🛠️ Utilitas & Edukasi",
    tagClass: "suite-tag-mint",
    desc: "Peralatan praktis harian, ensiklopedia bahasa & pengetahuan, serta portal ibadah digital.",
    toolIds: ["qr-studio", "tts-studio", "shortlink-studio", "ocr-scanner", "cek-pln", "religi-hub", "geo-info", "encyclopedia-hub", "lyrics-finder"]
  }
];

// Warna Brat resmi
const BRAT_COLORS = {
  putih: "#FFFFFF",
  hijau: "#8ace00",
  merah: "#ff5c5c",
  biru: "#5cb3ff",
  kuning: "#fff45c",
  pink: "#ff8dc7",
  ungu: "#c9a0ff",
  oranye: "#ffa54d",
  tosca: "#5cf0e0",
  abuabu: "#d3d3d3",
  coklat: "#d2a679",
};

let currentBratColor = "#FFFFFF";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderSuitesView();
  initCategoryPills();
  initSearch();
  initQuickBar();
  initModalCloseEvents();

  // Mode Switcher & Google AI Mode (Serba Tahu)
  initModeSwitcher();
  initGoogleAiMode();

  // Inisialisasi setiap studio workspace
  initBratStudio();
  initDownloaderStudio();
  initRemoveBgStudio();
  initAiStudio();
  initConverterStudio();
  initOcrStudio();
  initPlnStudio();
  initPdfStudio();
  initBratVideoStudio();
  initQuoteChatStudio();
  initHdrStudio();
  initRecolorStudio();
  initStickerMakerStudio();
  initImageGenStudio();
  initQrStudio();
  initTtsStudio();
  initShortlinkStudio();
  initReligiStudio();
  initEncyclopediaStudio();
  initGeoInfoStudio();
  initLyricsStudio();
});

// ==========================================================================
// 1. Dark / Light Mode (Flat Solid)
// ==========================================================================
function initTheme() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const toggleBtnAi = document.getElementById("themeToggleBtnAi");
  const themeIcon = document.getElementById("themeIcon");
  const themeIconAi = document.getElementById("themeIconAi");
  const savedTheme = localStorage.getItem("hekatools-theme") || "light";

  const updateIcons = (isDark) => {
    const icon = isDark ? "☀️" : "🌙";
    if (themeIcon) themeIcon.textContent = icon;
    if (themeIconAi) themeIconAi.textContent = icon;
  };

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateIcons(true);
  } else {
    document.body.classList.remove("dark-mode");
    updateIcons(false);
  }

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("hekatools-theme", isDark ? "dark" : "light");
    updateIcons(isDark);
  };

  if (toggleBtn) toggleBtn.addEventListener("click", toggleTheme);
  if (toggleBtnAi) toggleBtnAi.addEventListener("click", toggleTheme);
}

// ==========================================================================
// Mode Switcher (Tools View vs Mode AI Google Serba Tahu)
// ==========================================================================
function switchMode(mode) {
  const toolsView = document.getElementById("toolsViewContainer");
  const aiView = document.getElementById("googleAiViewContainer");
  const toolsHeader = document.getElementById("toolsHeaderInner");
  const aiHeader = document.getElementById("aiHeaderInner");
  const tabTools = document.getElementById("tabBtnTools");
  const tabAi = document.getElementById("tabBtnAi");
  const searchBox = document.querySelector(".search-box");
  const siteFooter = document.getElementById("siteFooter");

  if (mode === "ai") {
    document.body.classList.add("mode-ai");
    if (toolsView) toolsView.style.display = "none";
    if (aiView) aiView.style.display = "flex";
    if (toolsHeader) toolsHeader.style.display = "none";
    if (aiHeader) aiHeader.style.display = "flex";
    if (siteFooter) siteFooter.style.display = "none";
    if (tabTools) {
      tabTools.classList.remove("active");
      tabTools.setAttribute("aria-selected", "false");
    }
    if (tabAi) {
      tabAi.classList.add("active");
      tabAi.setAttribute("aria-selected", "true");
    }
    if (searchBox) searchBox.style.opacity = "0.35";
    localStorage.setItem("hekatools-active-mode", "ai");
    window.scrollTo(0, 0);
    setTimeout(() => {
      const input = document.getElementById("googleAiInput");
      if (input) input.focus();
    }, 80);
  } else {
    document.body.classList.remove("mode-ai");
    if (toolsView) toolsView.style.display = "block";
    if (aiView) aiView.style.display = "none";
    if (toolsHeader) toolsHeader.style.display = "flex";
    if (aiHeader) aiHeader.style.display = "none";
    if (siteFooter) siteFooter.style.display = "block";
    if (tabTools) {
      tabTools.classList.add("active");
      tabTools.setAttribute("aria-selected", "true");
    }
    if (tabAi) {
      tabAi.classList.remove("active");
      tabAi.setAttribute("aria-selected", "false");
    }
    if (searchBox) searchBox.style.opacity = "1";
    localStorage.setItem("hekatools-active-mode", "tools");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function initModeSwitcher() {
  const tabTools = document.getElementById("tabBtnTools");
  const tabAi = document.getElementById("tabBtnAi");
  const backBtn = document.getElementById("btnBackToTools");

  if (tabTools) {
    tabTools.addEventListener("click", () => switchMode("tools"));
  }
  if (tabAi) {
    tabAi.addEventListener("click", () => switchMode("ai"));
  }
  if (backBtn) {
    backBtn.addEventListener("click", () => switchMode("tools"));
  }

  // Restore saved view mode preference
  const saved = localStorage.getItem("hekatools-active-mode");
  if (saved === "ai") {
    switchMode("ai");
  }
}

// ==========================================================================
// 2. Render Katalog Alat & 3 Seksi Suite Bertingkat
// ==========================================================================
function createToolCardElement(tool) {
  const card = document.createElement("div");
  card.className = "tool-card";
  card.onclick = () => handleToolAction(tool.action, tool);

  card.innerHTML = `
    <div>
      <div class="tool-card-header">
        <div class="tool-icon-box ${tool.iconClass}">
          ${tool.icon}
        </div>
        <div>
          <h3 class="tool-card-title">${escapeHtml(tool.name)}</h3>
        </div>
      </div>
      <p class="tool-card-desc">${escapeHtml(tool.desc)}</p>
    </div>
    <div class="tool-card-footer">
      <span class="tool-badge ${tool.badgeClass}">${escapeHtml(tool.badge)}</span>
      <button class="btn-run" type="button" onclick="event.stopPropagation(); handleToolAction('${tool.action}', ${JSON.stringify(tool).replace(/"/g, '&quot;')});">Buka Studio</button>
    </div>
  `;
  return card;
}

let activeFilterCategory = "all";
let currentSearchQuery = "";

function renderSuitesView() {
  const container = document.getElementById("toolsContainer") || document.getElementById("toolsGrid");
  if (!container) return;
  container.innerHTML = "";

  const query = (currentSearchQuery || "").toLowerCase().trim();

  // Mode 1: Pencarian Aktif
  if (query) {
    const matchedTools = TOOLS_CATALOG.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
    );

    if (matchedTools.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); margin-top: 10px;">
          <div style="font-size: 2.2rem; margin-bottom: 10px;">🔍</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Tidak ada alat yang cocok dengan "${escapeHtml(query)}"</h3>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto 16px auto;">Coba kata kunci lain seperti 'tiktok', 'brat', 'pdf', 'quran', atau 'cuaca'.</p>
          <button class="btn-outline" id="btnResetSearchPrompt" style="display: inline-flex; align-items: center; gap: 6px;">
            ✕ Reset Pencarian
          </button>
        </div>
      `;
      const resetSearchBtn = container.querySelector("#btnResetSearchPrompt");
      if (resetSearchBtn) {
        resetSearchBtn.addEventListener("click", () => {
          const searchInput = document.getElementById("searchInput");
          if (searchInput) searchInput.value = "";
          currentSearchQuery = "";
          renderSuitesView();
        });
      }
      return;
    }

    // Tampilkan hasil pencarian yang dikelompokkan berdasarkan suite
    let renderedAny = false;
    SUITES.forEach((suite) => {
      const suiteMatches = matchedTools.filter((t) => suite.toolIds.includes(t.id));
      if (suiteMatches.length > 0) {
        renderedAny = true;
        const suiteEl = document.createElement("div");
        suiteEl.className = "suite-section";
        suiteEl.innerHTML = `
          <div class="suite-header">
            <div class="suite-header-left">
              <div class="suite-badge-wrapper">
                <span class="suite-tag ${suite.tagClass}">${suite.tag}</span>
                <span class="suite-count-chip">${suiteMatches.length} Ditemukan</span>
              </div>
              <h2 class="suite-title">${suite.title}</h2>
            </div>
          </div>
          <div class="tools-grid"></div>
        `;
        const grid = suiteEl.querySelector(".tools-grid");
        suiteMatches.forEach((tool) => grid.appendChild(createToolCardElement(tool)));
        container.appendChild(suiteEl);
      }
    });

    if (!renderedAny) {
      const genericSection = document.createElement("div");
      genericSection.className = "suite-section";
      genericSection.innerHTML = `
        <div class="suite-header">
          <div class="suite-header-left">
            <span class="suite-tag suite-tag-blue">🔍 Hasil Pencarian</span>
            <h2 class="suite-title">Ditemukan ${matchedTools.length} Alat</h2>
          </div>
        </div>
        <div class="tools-grid"></div>
      `;
      const grid = genericSection.querySelector(".tools-grid");
      matchedTools.forEach((tool) => grid.appendChild(createToolCardElement(tool)));
      container.appendChild(genericSection);
    }
    return;
  }

  // Mode 2: Filter Seksi Suite atau Kategori Spesifik (Bukan "all")
  if (activeFilterCategory !== "all") {
    const targetSuite = SUITES.find((s) => s.id === activeFilterCategory);
    let suiteTools = [];
    let sectionTag = "📂 Seksi Terpilih";
    let sectionTagClass = "suite-tag-blue";
    let sectionTitle = "Kategori Terpilih";
    let sectionDesc = "Menampilkan alat-alat pilihan yang berada di bawah seksi ini.";

    if (targetSuite) {
      suiteTools = TOOLS_CATALOG.filter((t) => targetSuite.toolIds.includes(t.id));
      sectionTag = targetSuite.tag;
      sectionTagClass = targetSuite.tagClass;
      sectionTitle = targetSuite.title;
      sectionDesc = targetSuite.desc;
    } else {
      suiteTools = TOOLS_CATALOG.filter((t) => t.category === activeFilterCategory);
      sectionTitle = activeFilterCategory.toUpperCase();
    }

    const filterSection = document.createElement("div");
    filterSection.className = "suite-section";
    filterSection.innerHTML = `
      <div class="suite-header">
        <div class="suite-header-left">
          <div class="suite-badge-wrapper">
            <span class="suite-tag ${sectionTagClass}">${sectionTag}</span>
            <span class="suite-count-chip">${suiteTools.length} Alat</span>
          </div>
          <h2 class="suite-title">${sectionTitle}</h2>
          <p class="suite-desc">${sectionDesc}</p>
        </div>
        <div>
          <button class="btn-outline" id="btnResetToAllSuites" style="font-size: 0.85rem; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>←</span> Tampilkan Semua 3 Seksi
          </button>
        </div>
      </div>
      <div class="tools-grid"></div>
    `;

    const grid = filterSection.querySelector(".tools-grid");
    suiteTools.forEach((tool) => grid.appendChild(createToolCardElement(tool)));
    container.appendChild(filterSection);

    const resetBtn = filterSection.querySelector("#btnResetToAllSuites");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        document.querySelectorAll(".pill-btn").forEach((p) => {
          p.classList.remove("active");
          p.setAttribute("aria-selected", "false");
        });
        const allPill = document.querySelector('.pill-btn[data-category="all"]');
        if (allPill) {
          allPill.classList.add("active");
          allPill.setAttribute("aria-selected", "true");
        }
        activeFilterCategory = "all";
        renderSuitesView();
      });
    }
    return;
  }

  // Mode 3: Default Beranda (3 Seksi Besar Bertingkat)
  SUITES.forEach((suite) => {
    const suiteTools = TOOLS_CATALOG.filter((t) => suite.toolIds.includes(t.id));
    if (suiteTools.length === 0) return;

    const suiteEl = document.createElement("div");
    suiteEl.className = "suite-section";
    suiteEl.id = suite.id;

    suiteEl.innerHTML = `
      <div class="suite-header">
        <div class="suite-header-left">
          <div class="suite-badge-wrapper">
            <span class="suite-tag ${suite.tagClass}">${suite.tag}</span>
            <span class="suite-count-chip">${suiteTools.length} Alat</span>
          </div>
          <h2 class="suite-title">${suite.title}</h2>
          <p class="suite-desc">${suite.desc}</p>
        </div>
      </div>
      <div class="tools-grid"></div>
    `;

    const grid = suiteEl.querySelector(".tools-grid");
    suiteTools.forEach((tool) => {
      grid.appendChild(createToolCardElement(tool));
    });

    container.appendChild(suiteEl);
  });
}

function initCategoryPills() {
  const pills = document.querySelectorAll(".pill-btn");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => {
        p.classList.remove("active");
        p.setAttribute("aria-selected", "false");
      });
      pill.classList.add("active");
      pill.setAttribute("aria-selected", "true");

      activeFilterCategory = pill.getAttribute("data-category") || "all";
      renderSuitesView();
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    renderSuitesView();
  });
}

function initQuickBar() {
  const quickInput = document.getElementById("quickUrlInput");
  const quickBtn = document.getElementById("quickProcessBtn");

  quickBtn.addEventListener("click", () => {
    const val = quickInput.value.trim();
    if (!val) {
      alert("Silakan masukkan link terlebih dahulu!");
      return;
    }

    openModal("downloaderModal");
    const urlInput = document.getElementById("downloaderUrlInput");
    const platformSelect = document.getElementById("downloaderPlatform");
    if (urlInput) {
      urlInput.value = val;
      urlInput.dispatchEvent(new Event("input"));
    }

    if (platformSelect) {
      if (/tiktok\.com/i.test(val)) platformSelect.value = "tiktok";
      else if (/youtu\.be|youtube\.com/i.test(val)) platformSelect.value = "youtube";
      else if (/instagram\.com/i.test(val)) platformSelect.value = "instagram";
      else if (/facebook\.com|fb\.watch/i.test(val)) platformSelect.value = "facebook";
      else if (/capcut\.com/i.test(val)) platformSelect.value = "capcut";
      else if (/pinterest\.com|pin\.it/i.test(val)) platformSelect.value = "pinterest";
      else platformSelect.value = "auto";
      platformSelect.dispatchEvent(new Event("change"));
    }

    const processBtn = document.getElementById("btnProcessDownloader");
    if (processBtn) processBtn.click();
  });

  quickInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") quickBtn.click();
  });
}

// ==========================================================================
// 3. Modal Management & Dispatcher
// ==========================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Kunci scroll background di Android & iOS
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    // Pulihkan scroll jika tidak ada modal lain yang aktif
    if (document.querySelectorAll(".modal-overlay.active").length === 0) {
      document.body.style.overflow = "";
    }
  }
}

function initModalCloseEvents() {
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      closeModal(modalId);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
        if (document.querySelectorAll(".modal-overlay.active").length === 0) {
          document.body.style.overflow = "";
        }
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach((m) => m.classList.remove("active"));
      document.body.style.overflow = "";
    }
  });
}

function handleToolAction(action, tool) {
  if (action === "openDownloaderModal") {
    openModal("downloaderModal");
  } else if (
    action === "openTiktokModal" ||
    action === "openYoutubeModal" ||
    action === "openInstagramModal" ||
    action === "openFacebookModal" ||
    action === "openCapcutModal" ||
    action === "openPinterestModal"
  ) {
    openModal("downloaderModal");
    const platformSelect = document.getElementById("downloaderPlatform");
    if (platformSelect) {
      if (action === "openTiktokModal") platformSelect.value = "tiktok";
      else if (action === "openYoutubeModal") platformSelect.value = "youtube";
      else if (action === "openInstagramModal") platformSelect.value = "instagram";
      else if (action === "openFacebookModal") platformSelect.value = "facebook";
      else if (action === "openCapcutModal") platformSelect.value = "capcut";
      else if (action === "openPinterestModal") platformSelect.value = "pinterest";
      platformSelect.dispatchEvent(new Event("change"));
    }
  } else if (action === "openBratModal") openModal("bratModal");
  else if (action === "openRemoveBgModal") openModal("removeBgModal");
  else if (action === "openAiModal") switchMode("ai");
  else if (action === "openConverterModal") openModal("converterModal");
  else if (action === "openOcrModal") openModal("ocrModal");
  else if (action === "openConverterFileModal" || action === "openPdfModal") openModal("pdfModal");
  else if (action === "openDocToPdfModal") {
    openModal("pdfModal");
    const fromSel = document.getElementById("convertFromFile");
    const toSel = document.getElementById("convertToFile");
    if (fromSel && toSel) {
      fromSel.value = "word";
      toSel.value = "pdf";
      fromSel.dispatchEvent(new Event("change"));
    }
  } else if (action === "openPdfToDocModal") {
    openModal("pdfModal");
    const fromSel = document.getElementById("convertFromFile");
    const toSel = document.getElementById("convertToFile");
    if (fromSel && toSel) {
      fromSel.value = "pdf";
      toSel.value = "word";
      fromSel.dispatchEvent(new Event("change"));
    }
  }
  else if (action === "openBratVideoModal") openModal("bratVideoModal");
  else if (action === "openQuoteChatModal") openModal("quoteChatModal");
  else if (action === "openHdrModal") openModal("hdrModal");
  else if (action === "openRecolorModal") openModal("recolorModal");
  else if (action === "openStickerMakerModal") openModal("stickerMakerModal");
  else if (action === "openImageGenModal") openModal("imageGenModal");
  else if (action === "openQrStudioModal") openModal("qrStudioModal");
  else if (action === "openTtsModal") openModal("ttsStudioModal");
  else if (action === "openShortlinkModal") openModal("shortlinkModal");
  else if (action === "openReligiModal") openModal("religiModal");
  else if (action === "openEncyclopediaModal") openModal("encyclopediaModal");
  else if (action === "openGeoInfoModal") openModal("geoInfoModal");
  else if (action === "openLyricsModal") openModal("lyricsModal");
  else {
    alert(`Alat "${tool?.name || 'ini'}" siap digunakan.`);
  }
}

// ==========================================================================
// 4. Downloader Video & Media Studio (All-in-One Social Media Downloader)
// ==========================================================================
function initDownloaderStudio() {
  const platformSelect = document.getElementById("downloaderPlatform");
  const formatSelect = document.getElementById("downloaderFormat");
  const urlInput = document.getElementById("downloaderUrlInput");
  const pasteBtn = document.getElementById("btnPasteDownloaderUrl");
  const hintText = document.getElementById("downloaderHintText");
  const processBtn = document.getElementById("btnProcessDownloader");

  const idleState = document.getElementById("downloaderIdleState");
  const processingState = document.getElementById("downloaderProcessingState");
  const successState = document.getElementById("downloaderSuccessState");
  const mediaContainer = document.getElementById("downloaderMediaContainer");
  const resultTitle = document.getElementById("downloaderResultTitle");
  const sourceTag = document.getElementById("downloaderSourceTag");
  const downloadBtn = document.getElementById("btnDownloadMedia");
  const resetBtn = document.getElementById("btnResetDownloader");

  if (!processBtn) return;

  const platformConfigs = {
    auto: {
      placeholder: "Tempel tautan video dari TikTok, YouTube, Instagram, dll...",
      hint: "Mendukung link TikTok, YouTube, Instagram Reels, Facebook, CapCut, & Pinterest.",
      defaultFormat: "video",
    },
    tiktok: {
      placeholder: "Tempel link video TikTok (contoh: https://vt.tiktok.com/...)",
      hint: "Otomatis mengunduh video HD tanpa watermark atau audio MP3 jernih.",
      defaultFormat: "video",
    },
    youtube: {
      placeholder: "Tempel link YouTube (contoh: https://youtu.be/...)",
      hint: "Unduh video kualitas jernih atau konversi ke MP3.",
      defaultFormat: "video",
    },
    instagram: {
      placeholder: "Tempel link Instagram Reels / Post (contoh: https://www.instagram.com/reel/...)",
      hint: "Unduh reels, video feed, atau foto carousel tanpa watermark.",
      defaultFormat: "video",
    },
    facebook: {
      placeholder: "Tempel link video Facebook publik atau Watch...",
      hint: "Mendukung video publik Facebook kualitas HD atau SD.",
      defaultFormat: "video",
    },
    capcut: {
      placeholder: "Tempel link template CapCut (contoh: https://www.capcut.com/t/...)",
      hint: "Ekstrak template video CapCut bersih tanpa watermark.",
      defaultFormat: "video",
    },
    pinterest: {
      placeholder: "Tempel link Pinterest pin (contoh: https://pin.it/...)",
      hint: "Unduh foto kualitas tinggi atau video pin Pinterest.",
      defaultFormat: "video",
    },
  };

  function updatePlatformState() {
    const selected = platformSelect.value;
    const cfg = platformConfigs[selected] || platformConfigs.auto;
    urlInput.placeholder = cfg.placeholder;
    if (hintText) hintText.textContent = cfg.hint;
  }

  platformSelect.addEventListener("change", updatePlatformState);

  // Auto detect platform when user types or pastes if platform is 'auto'
  urlInput.addEventListener("input", () => {
    const val = urlInput.value.trim();
    if (platformSelect.value === "auto" && val) {
      if (/tiktok\.com/i.test(val)) {
        if (hintText) hintText.innerHTML = "Terdeteksi: <strong>TikTok</strong> (No Watermark / MP3)";
      } else if (/youtu\.be|youtube\.com/i.test(val)) {
        if (hintText) hintText.innerHTML = "Terdeteksi: <strong>YouTube</strong> (HD Video / MP3)";
      } else if (/instagram\.com/i.test(val)) {
        if (hintText) hintText.innerHTML = "Terdeteksi: <strong>Instagram</strong> (Reels / Post)";
      } else if (/facebook\.com|fb\.watch/i.test(val)) {
        if (hintText) hintText.innerHTML = "Terdeteksi: <strong>Facebook</strong> (Video HD/SD)";
      } else if (/capcut\.com/i.test(val)) {
        if (hintText) hintText.innerHTML = "Terdeteksi: <strong>CapCut</strong> (Template Video)";
      } else if (/pinterest\.com|pin\.it/i.test(val)) {
        if (hintText) hintText.innerHTML = "Terdeteksi: <strong>Pinterest</strong> (Pin Foto / Video)";
      } else {
        if (hintText) hintText.textContent = platformConfigs.auto.hint;
      }
    }
  });

  // Tombol Paste / Tempel dari Clipboard
  if (pasteBtn) {
    pasteBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          urlInput.dispatchEvent(new Event("input"));
          urlInput.focus();
        }
      } catch (err) {
        urlInput.focus();
      }
    });
  }

  // Reset to idle state
  function resetStudio() {
    urlInput.value = "";
    mediaContainer.innerHTML = "";
    idleState.style.display = "block";
    processingState.style.display = "none";
    successState.style.display = "none";
    processBtn.disabled = false;
    processBtn.innerHTML = "⚡ Unduh Media Sekarang";
    updatePlatformState();
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetStudio);
  }

  // Handle Process Download
  processBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert("Silakan masukkan tautan / URL media terlebih dahulu!");
      urlInput.focus();
      return;
    }

    const type = formatSelect.value || "video";

    idleState.style.display = "none";
    processingState.style.display = "block";
    successState.style.display = "none";
    processBtn.disabled = true;
    processBtn.innerHTML = "⏳ Sedang Mengunduh...";

    try {
      const res = await fetch("/api/tools/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal mengunduh media dari link tersebut.");
      }

      // Render media
      mediaContainer.innerHTML = "";
      if (data.mediaType === "audio" || type === "audio") {
        const audio = document.createElement("audio");
        audio.src = data.mediaBase64;
        audio.controls = true;
        audio.style.width = "100%";
        audio.style.margin = "10px 0";
        mediaContainer.appendChild(audio);
      } else if (data.mediaType === "image") {
        const img = document.createElement("img");
        img.src = data.mediaBase64;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "240px";
        img.style.borderRadius = "8px";
        img.style.objectFit = "contain";
        mediaContainer.appendChild(img);
      } else {
        const video = document.createElement("video");
        video.src = data.mediaBase64;
        video.controls = true;
        video.style.maxWidth = "100%";
        video.style.maxHeight = "240px";
        video.style.borderRadius = "8px";
        mediaContainer.appendChild(video);
      }

      // Metadata title and platform badge
      resultTitle.textContent = data.title || "Media Siap Disimpan";
      const sourceMap = {
        tiktok: "🎵 TikTok",
        youtube: "▶️ YouTube",
        instagram: "📸 Instagram",
        facebook: "👥 Facebook",
        capcut: "🎬 CapCut",
        pinterest: "📌 Pinterest",
        ytdlp: "🌐 Web Media",
      };
      sourceTag.textContent = `✅ ${sourceMap[data.source] || "Media Diunduh"}`;

      // Download button
      const defName = type === "audio" ? "audio_download.mp3" : "video_download.mp4";
      downloadBtn.href = data.mediaBase64;
      downloadBtn.download = data.filename || defName;

      processingState.style.display = "none";
      successState.style.display = "block";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
      idleState.style.display = "block";
      processingState.style.display = "none";
      successState.style.display = "none";
    } finally {
      processBtn.disabled = false;
      processBtn.innerHTML = "⚡ Unduh Media Sekarang";
    }
  });

  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") processBtn.click();
  });
}

// ==========================================================================
// 5. Brat Sticker Studio (Live 2-Kolom Preview)
// ==========================================================================
function initBratStudio() {
  const chipsContainer = document.getElementById("bratColorChips");
  const textInput = document.getElementById("bratTextInput");
  const generateBtn = document.getElementById("btnGenerateBrat");
  const previewImg = document.getElementById("bratPreviewImg");
  const placeholder = document.getElementById("bratPreviewPlaceholder");
  const downloadBtn = document.getElementById("btnDownloadBrat");

  if (!generateBtn) return;

  chipsContainer.innerHTML = "";
  Object.entries(BRAT_COLORS).forEach(([name, hex], idx) => {
    const chip = document.createElement("div");
    chip.className = `color-chip ${idx === 0 ? "active" : ""}`;
    chip.style.backgroundColor = hex;
    chip.title = name;
    chip.onclick = () => {
      document.querySelectorAll(".color-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentBratColor = hex;
    };
    chipsContainer.appendChild(chip);
  });

  generateBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (!text) {
      alert("Tulis kata-kata untuk stiker Brat!");
      return;
    }

    generateBtn.textContent = "⏳ Merender Kanvas...";
    generateBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/brat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, bgColor: currentBratColor }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal merender gambar");
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      previewImg.src = objectUrl;
      previewImg.style.display = "block";
      placeholder.style.display = "none";

      downloadBtn.href = objectUrl;
      downloadBtn.download = `brat_${Date.now()}.png`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      generateBtn.textContent = "⚡ Buat Stiker Sekarang";
      generateBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 6. Remove BG Studio (2-Kolom dengan Checkerboard)
// ==========================================================================
function initRemoveBgStudio() {
  const fileInput = document.getElementById("rbFileInput");
  const processBtn = document.getElementById("btnProcessRb");
  const placeholder = document.getElementById("rbPlaceholder");
  const resultImg = document.getElementById("rbResultImg");
  const downloadBtn = document.getElementById("btnDownloadRb");

  if (!processBtn) return;
  let base64Image = null;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      base64Image = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    if (!base64Image) {
      alert("Pilih foto terlebih dahulu!");
      return;
    }

    processBtn.textContent = "⏳ Menghapus Background (AI)...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/removebg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal menghapus background");

      placeholder.style.display = "none";
      resultImg.src = data.image;
      resultImg.style.display = "block";
      downloadBtn.href = data.image;
      downloadBtn.download = `removebg_${Date.now()}.png`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Hapus Background Otomatis";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 7. AI Smart Assistant Studio (2-Kolom Prompt & Response)
// ==========================================================================
function initAiStudio() {
  const providerSelect = document.getElementById("aiProviderSelect");
  const promptInput = document.getElementById("chatPromptInput");
  const sendBtn = document.getElementById("btnSendAi");
  const placeholder = document.getElementById("aiPlaceholder");
  const responseText = document.getElementById("aiResponseText");
  const copyBtn = document.getElementById("btnCopyAi");

  if (!sendBtn) return;

  sendBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert("Ketik pertanyaan untuk AI!");
      return;
    }

    sendBtn.textContent = "⏳ Memikirkan Jawaban...";
    sendBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider: providerSelect.value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal memanggil AI");

      placeholder.style.display = "none";
      responseText.textContent = data.answer || "Tidak ada respons.";
      responseText.style.display = "block";
      copyBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      sendBtn.textContent = "🚀 Kirim ke AI Assistant";
      sendBtn.disabled = false;
    }
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(responseText.textContent);
    const old = copyBtn.textContent;
    copyBtn.textContent = "✅ Jawaban Berhasil Disalin!";
    setTimeout(() => {
      copyBtn.textContent = old;
    }, 2000);
  });
}

// ==========================================================================
// 7B. Mode AI Google (Serba Tahu) - Chat Bubble Engine (Tanpa Foto Profil)
// ==========================================================================
function initGoogleAiMode() {
  const input = document.getElementById("googleAiInput");
  const sendBtn = document.getElementById("btnSendGoogleAi");
  const modelSelect = document.getElementById("googleAiModelSelect");
  const dockModelSelect = document.getElementById("googleAiModelSelectDock");
  const dockModelText = document.getElementById("dockModelText");
  const messagesList = document.getElementById("googleAiMessagesList");
  const welcomeBox = document.getElementById("googleAiWelcome");
  const chatViewport = document.getElementById("googleAiChatViewport");
  const clearBtn = document.getElementById("btnClearAiChat");
  const btnPlus = document.getElementById("btnDockPlus");
  const plusMenu = document.getElementById("dockPlusMenu");
  const micBtn = document.getElementById("btnDockMic");
  const fileInput = document.getElementById("aiFileInput");
  const cameraInput = document.getElementById("aiCameraInput");
  const attachmentPreview = document.getElementById("aiAttachmentPreview");
  const attachmentThumbImg = document.getElementById("attachmentThumbImg");
  const attachmentThumbIcon = document.getElementById("attachmentThumbIcon");
  const attachmentName = document.getElementById("attachmentName");
  const attachmentSize = document.getElementById("attachmentSize");
  const btnRemoveAttachment = document.getElementById("btnRemoveAttachment");

  let currentAiMedia = null;

  if (!input || !sendBtn) return;

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function clearAiAttachment() {
    currentAiMedia = null;
    if (attachmentPreview) attachmentPreview.style.display = "none";
    if (attachmentThumbImg) {
      attachmentThumbImg.src = "";
      attachmentThumbImg.style.display = "none";
    }
    if (attachmentThumbIcon) {
      attachmentThumbIcon.style.display = "none";
      attachmentThumbIcon.textContent = "📄";
    }
    if (fileInput) fileInput.value = "";
    if (cameraInput) cameraInput.value = "";
    if (input) input.placeholder = "Tanyakan apa saja...";
  }

  function handleAiFileSelected(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 25 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const isImage = file.type.startsWith("image/");
      const ext = file.name.split(".").pop().toLowerCase();

      currentAiMedia = {
        base64,
        mimeType: file.type || (isImage ? "image/jpeg" : "application/octet-stream"),
        name: file.name,
        size: formatBytes(file.size),
        ext,
        isImage,
      };

      if (attachmentName) attachmentName.textContent = file.name;
      if (attachmentSize) attachmentSize.textContent = `${formatBytes(file.size)} • Siap di-solve AI`;

      if (isImage) {
        if (attachmentThumbImg) {
          attachmentThumbImg.src = base64;
          attachmentThumbImg.style.display = "block";
        }
        if (attachmentThumbIcon) attachmentThumbIcon.style.display = "none";
      } else {
        if (attachmentThumbImg) attachmentThumbImg.style.display = "none";
        if (attachmentThumbIcon) {
          let icon = "📄";
          if (ext === "pdf") icon = "📕";
          else if (["doc", "docx"].includes(ext)) icon = "📘";
          else if (["xls", "xlsx"].includes(ext)) icon = "📗";
          else if (["ppt", "pptx"].includes(ext)) icon = "📙";
          attachmentThumbIcon.textContent = icon;
          attachmentThumbIcon.style.display = "flex";
        }
      }

      if (attachmentPreview) attachmentPreview.style.display = "flex";
      input.focus();
      if (!input.value.trim()) {
        input.placeholder = isImage
          ? "Ketik instruksi/soal untuk foto ini (atau kirim langsung)..."
          : "Ketik instruksi pengerjaan untuk dokumen ini...";
      }
    };
    reader.readAsDataURL(file);
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleAiFileSelected(e.target.files[0]);
      }
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleAiFileSelected(e.target.files[0]);
      }
    });
  }

  if (btnRemoveAttachment) {
    btnRemoveAttachment.addEventListener("click", (e) => {
      e.stopPropagation();
      clearAiAttachment();
    });
  }

  // Sync Model Select antara Navbar dan Dock Pill
  const updateModelSelection = (val) => {
    let label = "Gemini 3.1";
    const activeSel = (dockModelSelect && dockModelSelect.value === val) ? dockModelSelect : (modelSelect || dockModelSelect);
    if (activeSel && activeSel.selectedOptions?.[0]) {
      label = activeSel.selectedOptions[0].getAttribute("data-short") || 
              activeSel.selectedOptions[0].textContent.split(" (")[0].trim();
    } else if (val) {
      if (val.startsWith("groq")) label = "Groq Llama";
      else if (val.startsWith("deepseek")) label = "DeepSeek";
      else if (val.startsWith("mistral") || val.startsWith("codestral")) label = "Mistral";
      else label = "Gemini 3.1";
    }
    if (dockModelText) dockModelText.textContent = label;
    if (dockModelSelect && dockModelSelect.value !== val) dockModelSelect.value = val;
    if (modelSelect && modelSelect.value !== val) modelSelect.value = val;
  };

  if (dockModelSelect) {
    dockModelSelect.addEventListener("change", (e) => updateModelSelection(e.target.value));
  }
  if (modelSelect) {
    modelSelect.addEventListener("change", (e) => updateModelSelection(e.target.value));
  }

  // Tombol Plus (+) & Quick Popover Menu (Gaya Google Gemini)
  if (btnPlus && plusMenu) {
    const togglePlusMenu = (show) => {
      const willShow = show !== undefined ? show : (plusMenu.style.display !== "flex");
      plusMenu.style.display = willShow ? "flex" : "none";
      if (willShow) {
        btnPlus.classList.add("active");
      } else {
        btnPlus.classList.remove("active");
      }
    };

    btnPlus.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlusMenu();
    });

    plusMenu.querySelectorAll(".dock-menu-item").forEach((item) => {
      item.addEventListener("click", () => {
        const action = item.getAttribute("data-action");
        if (action === "upload-image") {
          if (fileInput) {
            fileInput.accept = "image/*";
            fileInput.click();
          }
        } else if (action === "camera-image") {
          if (cameraInput) {
            cameraInput.click();
          }
        } else if (action === "upload-doc") {
          if (fileInput) {
            fileInput.accept = ".pdf,.txt,.doc,.docx,.xlsx,.ppt,.pptx";
            fileInput.click();
          }
        } else if (action === "prompt") {
          const textToInsert = item.getAttribute("data-insert") || "";
          input.value = textToInsert;
          input.focus();
          input.dispatchEvent(new Event("input"));
        } else if (action === "modal") {
          const modalId = item.getAttribute("data-modal");
          if (modalId && typeof openModal === "function") {
            openModal(modalId);
          }
        } else {
          const textToInsert = item.getAttribute("data-insert") || "";
          input.value = textToInsert;
          input.focus();
          input.dispatchEvent(new Event("input"));
        }
        togglePlusMenu(false);
      });
    });

    document.addEventListener("click", (e) => {
      if (!btnPlus.contains(e.target) && !plusMenu.contains(e.target)) {
        togglePlusMenu(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && plusMenu.style.display === "flex") {
        togglePlusMenu(false);
      }
    });
  }

  // Tombol Mikrofon Dikte Suara (Web Speech API)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SpeechRecognition && micBtn) {
    recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      micBtn.title = "Mendengarkan suara... klik untuk berhenti";
      input.placeholder = "Mendengarkan suara...";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      input.value = transcript;
      input.dispatchEvent(new Event("input"));
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove("listening");
      micBtn.title = "Dikte Suara (Mikrofon)";
      input.placeholder = "Tanyakan apa saja...";
    };

    recognition.onerror = () => {
      isListening = false;
      micBtn.classList.remove("listening");
      micBtn.title = "Dikte Suara (Mikrofon)";
      input.placeholder = "Tanyakan apa saja...";
    };

    micBtn.addEventListener("click", () => {
      if (isListening) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Speech recognition error:", err);
        }
      }
    });
  } else if (micBtn) {
    micBtn.addEventListener("click", () => {
      alert("Fitur dikte suara membutuhkan browser dengan dukungan Speech Recognition (seperti Google Chrome).");
    });
  }

  // Auto-resize textarea
  input.addEventListener("input", () => {
    input.style.height = "28px";
    if (input.value.trim() !== "") {
      input.style.height = Math.min(input.scrollHeight, 130) + "px";
    }
  });

  // Enter to send (Shift+Enter for newline)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  });

  sendBtn.addEventListener("click", () => handleSendPrompt());

  // Quick Prompt Cards
  document.querySelectorAll(".quick-prompt-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.getAttribute("data-prompt");
      if (prompt) {
        input.value = prompt;
        input.dispatchEvent(new Event("input"));
        handleSendPrompt();
      }
    });
  });

  // Clear Chat Button
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!messagesList || messagesList.children.length === 0) return;
      if (confirm("Hapus semua riwayat percakapan Mode AI Google?")) {
        messagesList.innerHTML = "";
        if (welcomeBox) welcomeBox.style.display = "block";
      }
    });
  }

  // Export Chat Dropdown & Export Engine
  const exportToggleBtn = document.getElementById("btnExportChatToggle");
  const exportDropdown = document.getElementById("exportChatDropdown");

  if (exportToggleBtn && exportDropdown) {
    exportToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = exportDropdown.style.display === "flex";
      exportDropdown.style.display = isVisible ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!exportToggleBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
        exportDropdown.style.display = "none";
      }
    });

    const exportOptions = exportDropdown.querySelectorAll(".export-option-btn");
    exportOptions.forEach(btn => {
      btn.addEventListener("click", () => {
        exportDropdown.style.display = "none";
        const type = btn.getAttribute("data-export-type");
        exportAiChat(type);
      });
    });
  }

  function exportAiChat(type) {
    if (!messagesList || messagesList.children.length === 0) {
      alert("Belum ada pesan dalam riwayat percakapan untuk diekspor!");
      return;
    }

    if (type === "pdf") {
      window.print();
      return;
    }

    const bubbles = messagesList.querySelectorAll(".google-chat-row");
    let exportText = "";
    const nowStr = new Date().toLocaleString("id-ID");

    if (type === "markdown") {
      exportText += `# Catatan Obrolan - HekaTools AI\n\n`;
      exportText += `*Dibuat pada: ${nowStr}*\n\n---\n\n`;

      bubbles.forEach(row => {
        const isUser = row.classList.contains("user-chat-row");
        const userText = row.querySelector(".user-chat-bubble")?.textContent?.trim() || "";
        const aiBubble = row.querySelector(".ai-chat-bubble");
        const aiHeader = row.querySelector(".ai-header-tag")?.textContent?.trim() || "AI Assistant";

        if (isUser) {
          exportText += `### 👤 Anda:\n${userText}\n\n`;
        } else if (aiBubble) {
          const aiRaw = aiBubble.getAttribute("data-raw-answer") || aiBubble.querySelector(".ai-bubble-text")?.innerText || "";
          exportText += `### 🤖 ${aiHeader}:\n${aiRaw}\n\n---\n\n`;
        }
      });

      const blob = new Blob([exportText], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hekatools_ai_chat_${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === "txt") {
      exportText += `CATATAN OBROLAN - HEKATOOLS AI\n`;
      exportText += `Waktu: ${nowStr}\n`;
      exportText += `=========================================\n\n`;

      bubbles.forEach(row => {
        const isUser = row.classList.contains("user-chat-row");
        const userText = row.querySelector(".user-chat-bubble")?.textContent?.trim() || "";
        const aiBubble = row.querySelector(".ai-chat-bubble");
        const aiHeader = row.querySelector(".ai-header-tag")?.textContent?.trim() || "AI Assistant";

        if (isUser) {
          exportText += `[ANDA]:\n${userText}\n\n`;
        } else if (aiBubble) {
          const aiText = aiBubble.querySelector(".ai-bubble-text")?.innerText || "";
          exportText += `[${aiHeader.toUpperCase()}]:\n${aiText}\n\n-----------------------------------------\n\n`;
        }
      });

      const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hekatools_ai_chat_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Lightweight, multi-language syntax highlighter engine (One Dark / VS Code style)
  function syntaxHighlightCode(code, lang) {
    if (!code) return "";
    const language = (lang || "code").toLowerCase();

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // 1. JSON
    if (language === "json") {
      const jsonTokens = /("(?:\\.|[^"\\])*"(?:\s*:)?|\b-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b(?:true|false|null)\b|[{}\[\],:])/g;
      return code.replace(jsonTokens, (match) => {
        if (match.startsWith("\"")) {
          if (match.endsWith(":")) {
            const key = match.slice(0, -1);
            return `<span class="tok-attr">${escapeHtml(key)}</span>:`;
          }
          return `<span class="tok-string">${escapeHtml(match)}</span>`;
        }
        if (/^(true|false|null)$/.test(match)) return `<span class="tok-builtin">${match}</span>`;
        if (/^-?\d/.test(match)) return `<span class="tok-number">${match}</span>`;
        return `<span class="tok-operator">${escapeHtml(match)}</span>`;
      });
    }

    // 2. HTML / XML / SVG
    if (language === "html" || language === "xml" || language === "svg") {
      const htmlTokens = /(<!--[\s\S]*?-->|<\/?[a-zA-Z0-9\-]+|[\w\-]+(?=\s*=)|"(?:\\.|[^"\\])*"|\x27(?:\\.|[^\x27\\])*\x27|[<>\/=])/g;
      return code.replace(htmlTokens, (match) => {
        if (match.startsWith("<!--")) return `<span class="tok-comment">${escapeHtml(match)}</span>`;
        if (match.startsWith("<")) {
          const isClose = match.startsWith("</");
          const tagName = match.slice(isClose ? 2 : 1);
          return `<span class="tok-operator">&lt;${isClose ? "/" : ""}</span><span class="tok-tag">${escapeHtml(tagName)}</span>`;
        }
        if (match.startsWith("\"") || match.startsWith("\x27")) {
          return `<span class="tok-string">${escapeHtml(match)}</span>`;
        }
        if (/^[a-zA-Z0-9\-_]+$/.test(match)) {
          return `<span class="tok-attr">${escapeHtml(match)}</span>`;
        }
        return `<span class="tok-operator">${escapeHtml(match)}</span>`;
      });
    }

    // 3. CSS / SCSS
    if (language === "css" || language === "scss") {
      const cssTokens = /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|\x27(?:\\.|[^\x27\\])*\x27|#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b|@[\w\-]+|!important|[\w\-]+(?=\s*:)|[:;{}()])/g;
      return code.replace(cssTokens, (match) => {
        if (match.startsWith("/*")) return `<span class="tok-comment">${escapeHtml(match)}</span>`;
        if (match.startsWith("\"") || match.startsWith("\x27")) return `<span class="tok-string">${escapeHtml(match)}</span>`;
        if (match.startsWith("#") && /^#[0-9a-fA-F]{3,8}$/.test(match)) return `<span class="tok-number">${escapeHtml(match)}</span>`;
        if (/^\d/.test(match)) return `<span class="tok-number">${escapeHtml(match)}</span>`;
        if (match.startsWith("@") || match === "!important") return `<span class="tok-keyword">${escapeHtml(match)}</span>`;
        if (/^[a-zA-Z0-9\-_]+$/.test(match)) return `<span class="tok-attr">${escapeHtml(match)}</span>`;
        return `<span class="tok-operator">${escapeHtml(match)}</span>`;
      });
    }

    // 4. Bahasa Pemrograman Umum (Python, JS, TS, Bash, PHP, Java, C++, Go, Rust, SQL, dll)
    const KEYWORDS = new Set([
      "if", "else", "elif", "for", "while", "do", "break", "continue", "return", "switch", "case", "default",
      "try", "catch", "finally", "throw", "throws", "class", "new", "import", "export", "from", "as", "async",
      "await", "yield", "function", "def", "const", "let", "var", "with", "lambda", "pass", "raise", "except",
      "in", "is", "not", "and", "or", "global", "nonlocal", "del", "assert", "typedef", "struct", "enum",
      "public", "private", "protected", "static", "final", "void", "interface", "extends", "implements", "package",
      "namespace", "using", "fn", "mut", "pub", "impl", "trait", "match", "defer", "go", "chan",
      "select", "from", "where", "insert", "into", "update", "delete", "create", "table", "drop", "alter",
      "join", "left", "right", "inner", "outer", "group", "by", "order", "having", "limit", "offset", "values",
      "sudo", "apt", "npm", "node", "git", "echo", "cd", "ls", "curl", "wget", "chmod", "pm2", "pip", "pip3", "python", "python3"
    ]);

    const BUILTINS = new Set([
      "true", "false", "null", "undefined", "none", "self", "this", "super", "print", "println", "console", "len",
      "range", "str", "int", "float", "list", "dict", "set", "tuple", "bool", "type", "open", "sum", "min", "max",
      "window", "document", "process", "math", "json", "promise", "array", "object", "string", "number", "boolean",
      "date", "regexp", "error", "map", "fetch", "require", "printf", "nil", "nan", "infinity"
    ]);

    const generalTokens = /(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(?:\/\/|#)[^\n]*|"""[\s\S]*?"""|\x27\x27\x27[\s\S]*?\x27\x27\x27|[frbFRB]?"(?:\\.|[^"\\])*"|[frbFRB]?\x27(?:\\.|[^\x27\\])*\x27|`[\s\S]*?`|\$[a-zA-Z_]\w*|\$\{[^}]+\}|@[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|[a-zA-Z_$][a-zA-Z0-9_$]*|[+\-*\/%=<>!&|^~:;,.()\[\]{}]+|\s+)/g;

    return code.replace(generalTokens, (token) => {
      if (!token) return "";

      if (/^\s+$/.test(token)) return token;

      if (token.startsWith("#") || token.startsWith("//") || token.startsWith("/*") || token.startsWith("<!--")) {
        return `<span class="tok-comment">${escapeHtml(token)}</span>`;
      }

      if (token.startsWith("@")) return `<span class="tok-decorator">${escapeHtml(token)}</span>`;
      if (token.startsWith("$")) return `<span class="tok-variable">${escapeHtml(token)}</span>`;

      if (token.startsWith("\"") || token.startsWith("\x27") || token.startsWith("`") ||
          /^[frbFRB]["\x27]/.test(token) || token.startsWith("\"\"\"") || token.startsWith("\x27\x27\x27")) {
        return `<span class="tok-string">${escapeHtml(token)}</span>`;
      }

      if (/^\d/.test(token) || /^0x[0-9a-fA-F]+/i.test(token)) {
        return `<span class="tok-number">${escapeHtml(token)}</span>`;
      }

      if (/^[a-zA-Z_$]/.test(token)) {
        const lower = token.toLowerCase();

        if (KEYWORDS.has(lower)) {
          return `<span class="tok-keyword">${token}</span>`;
        }

        if (BUILTINS.has(lower)) {
          return `<span class="tok-builtin">${token}</span>`;
        }

        if (/^[A-Z][a-zA-Z0-9_]*$/.test(token) && token !== token.toUpperCase()) {
          return `<span class="tok-type">${token}</span>`;
        }

        return `<span class="tok-ident">${token}</span>`;
      }

      return `<span class="tok-operator">${escapeHtml(token)}</span>`;
    });
  }

  // Helper: Render LaTeX math using KaTeX with rich HTML fallback
  function renderMath(expr, isDisplay) {
    if (!expr || !expr.trim()) return "";
    const cleanExpr = expr.trim();

    // 1. Coba gunakan KaTeX jika tersedia di window
    if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
      try {
        const katexHtml = window.katex.renderToString(cleanExpr, {
          displayMode: !!isDisplay,
          throwOnError: false,
          output: "htmlAndMathml"
        });
        if (isDisplay) {
          return `<div class="ai-math-display">${katexHtml}</div>`;
        }
        return `<span class="ai-math-inline">${katexHtml}</span>`;
      } catch (err) {
        console.warn("KaTeX render error:", err);
      }
    }

    // 2. Fallback rendering bila offline atau KaTeX belum terpasang
    return renderMathFallback(cleanExpr, isDisplay);
  }

  function renderMathFallback(expr, isDisplay) {
    let s = expr;

    // Matriks: \begin{pmatrix} a & b \\ c & d \end{pmatrix} atau bmatrix / matrix / vmatrix
    s = s.replace(/\\begin\{(?:pmatrix|bmatrix|matrix|vmatrix)\}([\s\S]*?)\\end\{(?:pmatrix|bmatrix|matrix|vmatrix)\}/g, function(_, body) {
      const rows = body.trim().split(/\\\\|\n/).map(function(r) { return r.trim(); }).filter(Boolean);
      const trs = rows.map(function(rowStr) {
        const cells = rowStr.split("&").map(function(cell) {
          return '<td class="math-matrix-cell">' + renderMathFallback(cell.trim(), false) + '</td>';
        }).join("");
        return '<tr>' + cells + '</tr>';
      }).join("");

      return '<span class="math-matrix"><span class="math-bracket bracket-left">[</span><table class="math-matrix-table">' + trs + '</table><span class="math-bracket bracket-right">]</span></span>';
    });

    // Pecahan: \frac{a}{b}
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span class="math-num">$1</span><span class="math-den">$2</span></span>');

    // Akar kuadrat: \sqrt{x} atau \sqrt[n]{x}
    s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, '<span class="math-sqrt"><sup>$1</sup>&radic;<span class="math-radicand">$2</span></span>');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-sqrt">&radic;<span class="math-radicand">$1</span></span>');

    // Pangkat (Superscript): x^{2} atau x^2
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/\^([a-zA-Z0-9+\-]+)/g, '<sup>$1</sup>');

    // Indeks bawah (Subscript): x_{1} atau x_1
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/_([a-zA-Z0-9+\-]+)/g, '<sub>$1</sub>');

    // Simbol matematika, fisika, dan operator umum
    s = s.replace(/\\times/g, '&times;');
    s = s.replace(/\\div/g, '&divide;');
    s = s.replace(/\\pm/g, '&plusmn;');
    s = s.replace(/\\mp/g, '&#8723;');
    s = s.replace(/\\cdot/g, '&sdot;');
    s = s.replace(/\\neq/g, '&ne;');
    s = s.replace(/\\approx/g, '&asymp;');
    s = s.replace(/\\leq/g, '&le;');
    s = s.replace(/\\geq/g, '&ge;');
    s = s.replace(/\\ll/g, '&Lt;');
    s = s.replace(/\\gg/g, '&Gt;');
    s = s.replace(/\\infty/g, '&infin;');
    s = s.replace(/\\int/g, '&int;');
    s = s.replace(/\\sum/g, '&sum;');
    s = s.replace(/\\prod/g, '&prod;');
    s = s.replace(/\\partial/g, '&part;');
    s = s.replace(/\\nabla/g, '&nabla;');
    s = s.replace(/\\Delta/g, '&Delta;');
    s = s.replace(/\\theta/g, '&theta;');
    s = s.replace(/\\omega/g, '&omega;');
    s = s.replace(/\\lambda/g, '&lambda;');
    s = s.replace(/\\alpha/g, '&alpha;');
    s = s.replace(/\\beta/g, '&beta;');
    s = s.replace(/\\gamma/g, '&gamma;');
    s = s.replace(/\\pi/g, '&pi;');
    s = s.replace(/\\sigma/g, '&sigma;');
    s = s.replace(/\\mu/g, '&mu;');
    s = s.replace(/\\rho/g, '&rho;');
    s = s.replace(/\\tau/g, '&tau;');
    s = s.replace(/\\phi/g, '&phi;');
    s = s.replace(/\\rightarrow|\\to/g, '&rarr;');
    s = s.replace(/\\leftarrow/g, '&larr;');
    s = s.replace(/\\det/g, 'det');
    s = s.replace(/\\text\{([^{}]+)\}/g, '$1');
    s = s.replace(/\\mathbf\{([^{}]+)\}/g, '<strong>$1</strong>');
    s = s.replace(/\\left[\[\(\{\|]/g, '');
    s = s.replace(/\\right[\]\)\}\|]/g, '');

    if (isDisplay) {
      return '<div class="ai-math-display math-fallback">' + s + '</div>';
    }
    return '<span class="ai-math-inline math-fallback">' + s + '</span>';
  }

  // Format response helper: parses code blocks, math formulas (KaTeX/LaTeX), inline code, bold, lists, and headings
  function formatAiResponse(raw) {
    if (!raw) return "";

    // 1. Pre-process: Ubah baris-baris kode yang dibungkus tanda bintang (*) menjadi blok kode standar
    let processed = raw;
    const linesRaw = processed.split("\n");
    let inAsteriskCode = false;
    let accumulatedCode = [];
    let reconstructedLines = [];

    const isCodeLine = (str) => {
      const s = str.trim();
      return /^(const\s|let\s|var\s|function\s|async\s|import\s|export\s|class\s|def\s|if\s*\(|for\s*\(|while\s*\(|try\s*\{|catch\s*\(|return\s|console\.|echo\s|print\(|SELECT\s|<[a-zA-Z]|\{|\}|process\.)/i.test(s) ||
             /(\(\)\s*\{|=>\s*\{|;\s*$|\[\]|\{\})/i.test(s);
    };

    for (let i = 0; i < linesRaw.length; i++) {
      const line = linesRaw[i];
      const match = line.match(/^\s*\*([^*]+)\*\s*$/);
      if (match && isCodeLine(match[1])) {
        if (!inAsteriskCode) {
          inAsteriskCode = true;
          accumulatedCode = [match[1]];
        } else {
          accumulatedCode.push(match[1]);
        }
      } else if (inAsteriskCode) {
        if (match && (/[\{\}\;\)\(]/.test(match[1]) || isCodeLine(match[1]))) {
          accumulatedCode.push(match[1]);
        } else if (line.trim() === "" && i + 1 < linesRaw.length && /^\s*\*([^*]+)\*\s*$/.test(linesRaw[i + 1])) {
          accumulatedCode.push("");
        } else {
          reconstructedLines.push("```javascript\n" + accumulatedCode.join("\n") + "\n```");
          inAsteriskCode = false;
          accumulatedCode = [];
          reconstructedLines.push(line);
        }
      } else {
        reconstructedLines.push(line);
      }
    }
    if (inAsteriskCode && accumulatedCode.length > 0) {
      reconstructedLines.push("```javascript\n" + accumulatedCode.join("\n") + "\n```");
    }
    processed = reconstructedLines.join("\n");

    // 2. Ekstrak semua blok kode (```lang ... ```) dan simpan ke placeholder khusus
    const codeBlocks = [];
    processed = processed.replace(/```([a-zA-Z0-9_\-\+\#]*)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = (lang || "code").toLowerCase();
      const trimmedCode = code.replace(/^\n+|\n+$/g, "");
      const safeCode = encodeURIComponent(trimmedCode);
      const highlightedHtml = syntaxHighlightCode(trimmedCode, language);

      const blockHtml = `
<div class="ai-code-block-wrapper">
  <div class="ai-code-header">
    <div class="ai-code-header-left">
      <div class="ai-code-dots">
        <span class="code-dot dot-red"></span>
        <span class="code-dot dot-yellow"></span>
        <span class="code-dot dot-green"></span>
      </div>
      <span class="ai-code-lang">${language}</span>
    </div>
    <button class="ai-code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${safeCode}')).then(()=>{ this.classList.add('copied'); this.innerHTML='<span>✅</span><span>Tersalin!</span>'; setTimeout(()=>{ this.classList.remove('copied'); this.innerHTML='<span>📋</span><span>Salin Kode</span>'; }, 2000); });">
      <span>📋</span>
      <span>Salin Kode</span>
    </button>
  </div>
  <pre class="ai-code-pre"><code class="ai-code-content language-${language}">${highlightedHtml}</code></pre>
</div>`;

      const placeholder = `%%%CODE_BLOCK_${codeBlocks.length}%%%`;
      codeBlocks.push(blockHtml);
      return `\n\n${placeholder}\n\n`;
    });

    // 3. Konversi matriks ASCII bila model mengirimkan pola baris matriks garis vertikal:
    // Contoh:
    // | a  b |
    // | c  d |
    processed = processed.replace(/(?:^[ \t]*\|[ \t]*[a-zA-Z0-9\+\-\/\*.,_]+(?:[ \t]+[a-zA-Z0-9\+\-\/\*.,_]+)+[ \t]*\|[ \t]*(?:\r?\n|$)){2,}/gm, (match) => {
      if (match.includes("---")) return match;
      const rows = match.trim().split(/\r?\n/).map(l => {
        const inner = l.trim().replace(/^\||\|$/g, '').trim();
        return inner.split(/\s+/).join(' & ');
      });
      return `\n\n$$\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}$$\n\n`;
    });

    // 4. Ekstrak Display Math: $$ ... $$ dan \[ ... \]
    const mathDisplayBlocks = [];
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, expr) => {
      const rendered = renderMath(expr, true);
      const placeholder = `%%%MATH_DISPLAY_${mathDisplayBlocks.length}%%%`;
      mathDisplayBlocks.push(rendered);
      return `\n\n${placeholder}\n\n`;
    });
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, expr) => {
      const rendered = renderMath(expr, true);
      const placeholder = `%%%MATH_DISPLAY_${mathDisplayBlocks.length}%%%`;
      mathDisplayBlocks.push(rendered);
      return `\n\n${placeholder}\n\n`;
    });

    // 5. Ekstrak Inline Math: \( ... \) dan $ ... $
    const mathInlineBlocks = [];
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, expr) => {
      const rendered = renderMath(expr, false);
      const placeholder = `%%%MATH_INLINE_${mathInlineBlocks.length}%%%`;
      mathInlineBlocks.push(rendered);
      return placeholder;
    });
    processed = processed.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, expr) => {
      const trimmed = expr.trim();
      if (!trimmed) return match;
      const rendered = renderMath(trimmed, false);
      const placeholder = `%%%MATH_INLINE_${mathInlineBlocks.length}%%%`;
      mathInlineBlocks.push(rendered);
      return prefix + placeholder;
    });

    // 6. Escape HTML pada teks di luar blok kode dan math
    let escaped = processed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Inline code `...`
    escaped = escaped.replace(/`([^`\n]+)`/g, '<code class="ai-inline-code">$1</code>');

    // Headings
    escaped = escaped.replace(/^###\s+(.+)$/gm, '<h4 class="ai-heading">$1</h4>');
    escaped = escaped.replace(/^##\s+(.+)$/gm, '<h3 class="ai-heading">$1</h3>');
    escaped = escaped.replace(/^#\s+(.+)$/gm, '<h3 class="ai-heading">$1</h3>');

    // Bold Markdown **text**
    escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

    // Bold WhatsApp *text*
    escaped = escaped.replace(/(^|[^\*a-zA-Z0-9_])\*([^\*\n]+)\*([^\*a-zA-Z0-9_]|$)/g, "$1<strong>$2</strong>$3");

    // Italic _text_
    escaped = escaped.replace(/(^|[^_a-zA-Z0-9])_([^_\n]+)_([^_a-zA-Z0-9]|$)/g, "$1<em>$2</em>$3");

    // 7. Pisahkan paragraf dan daftar (list)
    const blocks = escaped.split(/\n\s*\n/);
    const htmlBlocks = [];

    for (let block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      if (/^%%%CODE_BLOCK_\d+%%%$/.test(trimmed)) {
        htmlBlocks.push(trimmed);
        continue;
      }

      if (/^%%%MATH_DISPLAY_\d+%%%$/.test(trimmed)) {
        htmlBlocks.push(trimmed);
        continue;
      }

      const lines = trimmed.split("\n");
      const isList = lines.every(l => /^([-*•]|\d+\.)\s+/.test(l.trim()) || l.trim() === "");

      if (isList) {
        const isNumbered = /^\d+\./.test(lines[0].trim());
        const tag = isNumbered ? "ol" : "ul";
        const items = lines
          .map(l => l.trim())
          .filter(l => l)
          .map(l => `<li>${l.replace(/^([-*•]|\d+\.)\s+/, "")}</li>`)
          .join("");
        htmlBlocks.push(`<${tag}>${items}</${tag}>`);
      } else if (trimmed.startsWith("<h3") || trimmed.startsWith("<h4")) {
        htmlBlocks.push(trimmed);
      } else {
        const pContent = trimmed.replace(/\n/g, "<br>");
        htmlBlocks.push(`<p>${pContent}</p>`);
      }
    }

    let finalHtml = htmlBlocks.join("\n");

    // 8. Kembalikan placeholder Math Display
    for (let i = 0; i < mathDisplayBlocks.length; i++) {
      finalHtml = finalHtml.replace(`%%%MATH_DISPLAY_${i}%%%`, mathDisplayBlocks[i]);
    }

    // 9. Kembalikan placeholder Math Inline
    for (let i = 0; i < mathInlineBlocks.length; i++) {
      finalHtml = finalHtml.replace(`%%%MATH_INLINE_${i}%%%`, mathInlineBlocks[i]);
    }

    // 10. Kembalikan placeholder Code Blocks
    for (let i = 0; i < codeBlocks.length; i++) {
      finalHtml = finalHtml.replace(`%%%CODE_BLOCK_${i}%%%`, codeBlocks[i]);
    }

    return finalHtml;
  }

  // Generate contextual follow-up prompt chips (matching reference screenshot)
  function generateFollowUps(promptText, media) {
    if (media) {
      if (media.isImage) {
        return [
          "Jelaskan langkah demi langkah pengerjaan di atas",
          "Bagaimana rumus atau konsep dasar yang digunakan?",
          "Berikan contoh variasi soal sejenis lainnya"
        ];
      } else {
        return [
          "Rangkum intisari dokumen ini dalam 3 poin",
          "Ekstrak data dan temuan penting dari dokumen ini",
          "Apa kesimpulan dan rekomendasi dari dokumen ini?"
        ];
      }
    }
    const p = (promptText || "").toLowerCase();
    if (p.includes("koding") || p.includes("javascript") || p.includes("code") || p.includes("fungsi") || p.includes("python")) {
      return [
        "Berikan contoh implementasi kode lengkap dengan error handling",
        "Jelaskan baris per baris cara kerja kodingan di atas",
        "Bagaimana cara mengoptimalkan performa kodingan ini?"
      ];
    } else if (p.includes("konten") || p.includes("tiktok") || p.includes("ide") || p.includes("strategi")) {
      return [
        "Buatkan naskah/script singkat untuk durasi 30 detik",
        "Saran hook pembuka yang bikin audiens penasaran",
        "Bagaimana jadwal posting terbaik untuk topik ini?"
      ];
    } else if (p.includes("rangkum") || p.includes("bedanya") || p.includes("jelaskan") || p.includes("sains")) {
      return [
        "Jelaskan lebih detail dengan analogi kehidupan sehari-hari",
        "Berikan studi kasus nyata dari topik ini",
        "Rangkum dalam bentuk 3 poin utama saja"
      ];
    }
    return [
      "Jelaskan lebih mendalam poin di atas",
      "Berikan contoh konkret di dunia nyata",
      "Apa kelebihan dan kekurangannya?"
    ];
  }

  async function handleSendPrompt(customPrompt, customMedia) {
    const prompt = (customPrompt !== undefined ? customPrompt : input.value).trim();
    const mediaToSend = customMedia || currentAiMedia;

    if (!prompt && !mediaToSend) return;

    // Reset input dan pratinjau lampiran dari dock
    input.value = "";
    input.style.height = "28px";
    input.placeholder = "Tanyakan apa saja...";
    sendBtn.disabled = true;
    clearAiAttachment();

    // Sembunyikan welcome banner saat sudah mulai chat
    if (welcomeBox) welcomeBox.style.display = "none";

    // 1. Tambahkan Bubble Pesan Pengguna (Murni Bubble Chat Tanpa Foto Profil, dengan Media Lampiran)
    const userWrapper = document.createElement("div");
    userWrapper.className = "chat-msg-wrapper user-wrapper";

    let mediaSnippet = "";
    if (mediaToSend) {
      if (mediaToSend.isImage) {
        mediaSnippet = `
          <div class="user-bubble-media">
            <img class="user-bubble-img" src="${mediaToSend.base64}" alt="${escapeHtml(mediaToSend.name)}">
          </div>
        `;
      } else {
        let icon = "📄";
        if (mediaToSend.ext === "pdf") icon = "📕";
        else if (["doc", "docx"].includes(mediaToSend.ext)) icon = "📘";
        else if (["xls", "xlsx"].includes(mediaToSend.ext)) icon = "📗";
        else if (["ppt", "pptx"].includes(mediaToSend.ext)) icon = "📙";
        mediaSnippet = `
          <div class="user-bubble-doc">
            <span class="user-bubble-doc-icon">${icon}</span>
            <div class="user-bubble-doc-info">
              <span class="user-bubble-doc-name">${escapeHtml(mediaToSend.name)}</span>
              <span class="user-bubble-doc-size">${escapeHtml(mediaToSend.size || "")}</span>
            </div>
          </div>
        `;
      }
    }

    const textSnippet = prompt ? `<div class="user-bubble-text">${escapeHtml(prompt)}</div>` : "";

    userWrapper.innerHTML = `
      <div class="google-chat-bubble user-chat-bubble">
        ${mediaSnippet}
        ${textSnippet}
      </div>
    `;
    messagesList.appendChild(userWrapper);
    scrollToBottom();

    // 2. Tambahkan Indikator Berpikir (Thinking Bubble)
    const thinkingWrapper = document.createElement("div");
    thinkingWrapper.className = "chat-msg-wrapper ai-wrapper";
    thinkingWrapper.id = "activeAiThinking";
    const thinkingText = mediaToSend
      ? (mediaToSend.isImage ? "AI Google sedang memeriksa & menyelesaikan soal/gambar" : "AI Google sedang membaca & menganalisis dokumen")
      : "AI Google sedang berpikir";

    thinkingWrapper.innerHTML = `
      <div class="google-chat-bubble ai-thinking-bubble">
        <span class="thinking-sparkle">✨</span>
        <span>${thinkingText}</span>
        <div class="thinking-dots"><span></span><span></span><span></span></div>
      </div>
    `;
    messagesList.appendChild(thinkingWrapper);
    scrollToBottom();

    const startTime = Date.now();
    const provider = dockModelSelect ? dockModelSelect.value : (modelSelect ? modelSelect.value : "gemini");

    const reqPayload = { prompt, provider };
    if (mediaToSend) {
      reqPayload.media = {
        base64: mediaToSend.base64,
        mimeType: mediaToSend.mimeType,
        name: mediaToSend.name,
        ext: mediaToSend.ext,
      };
    }

    try {
      const res = await fetch("/api/tools/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal mendapatkan respon dari AI Google");

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const answerHtml = formatAiResponse(data.answer);
      const followUps = generateFollowUps(prompt, mediaToSend);

      // Hapus indikator berpikir
      const thinkingEl = document.getElementById("activeAiThinking");
      if (thinkingEl) thinkingEl.remove();

      // 3. Tambahkan Bubble Respon AI (Murni Tanpa Foto Profil, Gaya AI Google)
      const aiWrapper = document.createElement("div");
      aiWrapper.className = "chat-msg-wrapper ai-wrapper";

      let engineName = "AI Google Gemini";
      const activeSel = dockModelSelect || modelSelect;
      if (activeSel && activeSel.selectedOptions?.[0]) {
        engineName = activeSel.selectedOptions[0].textContent.split(" (")[0].trim();
      } else if (provider.startsWith("groq")) {
        engineName = "Groq AI";
      } else if (provider.startsWith("deepseek")) {
        engineName = "DeepSeek AI";
      } else if (provider.startsWith("mistral") || provider.startsWith("codestral")) {
        engineName = "Mistral AI";
      }

      aiWrapper.innerHTML = `
        <div class="google-chat-bubble ai-chat-bubble">
          <div class="ai-bubble-header">
            <span class="ai-header-tag">✨ ${engineName}</span>
            <span class="ai-think-badge">Telah berpikir dalam ${elapsedSec}s</span>
          </div>
          <div class="ai-bubble-text">${answerHtml}</div>
          <div class="ai-bubble-actions">
            <button class="btn-ai-action btn-copy-answer" title="Salin Jawaban">
              📋 <span>Salin</span>
            </button>
            <button class="btn-ai-action btn-regenerate" title="Buat Ulang">
              🔄 <span>Buat Ulang</span>
            </button>
            <button class="btn-ai-action btn-like" title="Bermanfaat">
              👍 <span>Bermanfaat</span>
            </button>
            <button class="btn-ai-action btn-speak-answer" title="Dengarkan Suara (TTS)">
              🔊 <span>Dengarkan</span>
            </button>
            <button class="btn-ai-action btn-save-answer" title="Simpan Catatan (.md)">
              📥 <span>Simpan</span>
            </button>
          </div>
          <div class="ai-followup-suggestions">
            ${followUps.map(f => `<button class="ai-followup-item" data-question="${escapeHtml(f)}">↘ ${escapeHtml(f)}</button>`).join("")}
          </div>
        </div>
      `;

      // Copy Action
      const copyBtn = aiWrapper.querySelector(".btn-copy-answer");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(data.answer);
          const label = copyBtn.querySelector("span");
          if (label) label.textContent = "Tersalin!";
          setTimeout(() => { if (label) label.textContent = "Salin"; }, 2000);
        });
      }

      // Regenerate Action
      const regenBtn = aiWrapper.querySelector(".btn-regenerate");
      if (regenBtn) {
        regenBtn.addEventListener("click", () => {
          handleSendPrompt(prompt, mediaToSend);
        });
      }

      // Like Action
      const likeBtn = aiWrapper.querySelector(".btn-like");
      if (likeBtn) {
        likeBtn.addEventListener("click", () => {
          likeBtn.style.color = "var(--primary)";
          likeBtn.style.borderColor = "var(--primary)";
        });
      }

      // TTS Speak Action
      const speakBtn = aiWrapper.querySelector(".btn-speak-answer");
      if (speakBtn) {
        speakBtn.addEventListener("click", () => {
          if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            speakBtn.classList.remove("speaking");
            const lbl = speakBtn.querySelector("span");
            if (lbl) lbl.textContent = "Dengarkan";
            return;
          }

          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const textToSpeak = (data.answer || "")
              .replace(/```[\s\S]*?```/g, "Kode program.")
              .replace(/\$\$[\s\S]*?\$\$/g, "Rumus matematika.")
              .replace(/[*_#`~]/g, "")
              .slice(0, 500);

            const utter = new SpeechSynthesisUtterance(textToSpeak);
            utter.lang = "id-ID";
            utter.rate = 1.0;
            speakBtn.classList.add("speaking");
            const lbl = speakBtn.querySelector("span");
            if (lbl) lbl.textContent = "Berhenti";

            utter.onend = () => {
              speakBtn.classList.remove("speaking");
              if (lbl) lbl.textContent = "Dengarkan";
            };
            utter.onerror = () => {
              speakBtn.classList.remove("speaking");
              if (lbl) lbl.textContent = "Dengarkan";
            };
            window.speechSynthesis.speak(utter);
          } else {
            alert("Browser Anda tidak mendukung Web Speech API.");
          }
        });
      }

      // Save Single Answer as Markdown
      const saveBtn = aiWrapper.querySelector(".btn-save-answer");
      if (saveBtn) {
        saveBtn.addEventListener("click", () => {
          const content = `# Jawaban ${engineName} - HekaTools\n\nTanggal: ${new Date().toLocaleString("id-ID")}\n\n---\n\n${data.answer}\n`;
          const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `jawaban_ai_${Date.now()}.md`;
          a.click();
          URL.revokeObjectURL(url);
          const lbl = saveBtn.querySelector("span");
          if (lbl) lbl.textContent = "Tersimpan!";
          setTimeout(() => { if (lbl) lbl.textContent = "Simpan"; }, 2000);
        });
      }

      // Follow-up Suggestion Chips Action
      aiWrapper.querySelectorAll(".ai-followup-item").forEach((chip) => {
        chip.addEventListener("click", () => {
          const q = chip.getAttribute("data-question");
          if (q) handleSendPrompt(q);
        });
      });

      messagesList.appendChild(aiWrapper);
      scrollToBottom();
    } catch (err) {
      const thinkingEl = document.getElementById("activeAiThinking");
      if (thinkingEl) thinkingEl.remove();

      const errorWrapper = document.createElement("div");
      errorWrapper.className = "chat-msg-wrapper ai-wrapper";
      errorWrapper.innerHTML = `
        <div class="google-chat-bubble ai-chat-bubble" style="border-color: var(--rose);">
          <div class="ai-bubble-header">
            <span class="ai-header-tag" style="color: var(--rose);">⚠️ Terjadi Kendala</span>
          </div>
          <div class="ai-bubble-text" style="color: var(--rose);">${escapeHtml(err.message)}</div>
          <div class="ai-bubble-actions">
            <button class="btn-ai-action btn-retry" style="color: var(--rose); border-color: var(--rose);">
              🔄 Coba Lagi
            </button>
          </div>
        </div>
      `;
      const retryBtn = errorWrapper.querySelector(".btn-retry");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => handleSendPrompt(prompt, mediaToSend));
      }
      messagesList.appendChild(errorWrapper);
      scrollToBottom();
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (chatViewport) chatViewport.scrollTop = chatViewport.scrollHeight;
    }, 50);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}


// ==========================================================================
// 8. Converter Video & Audio Studio (2-Kolom Player)
// ==========================================================================
function initConverterStudio() {
  const fileInput = document.getElementById("convFileInput");
  const processBtn = document.getElementById("btnProcessConv");
  const placeholder = document.getElementById("convPlaceholder");
  const audioPlayer = document.getElementById("convAudioPlayer");
  const downloadBtn = document.getElementById("btnDownloadConv");

  if (!processBtn) return;
  let base64File = null;
  let fileExt = "mp4";

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileExt = file.name.split(".").pop().toLowerCase() || "mp4";
    const reader = new FileReader();
    reader.onload = () => {
      base64File = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    if (!base64File) {
      alert("Pilih file video atau audio terlebih dahulu!");
      return;
    }

    const format = document.querySelector('input[name="convFormat"]:checked').value;
    processBtn.textContent = "⏳ Mengonversi Media (FFmpeg)...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64File, format, ext: fileExt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal mengonversi media");

      placeholder.style.display = "none";
      audioPlayer.src = data.mediaBase64;
      audioPlayer.style.display = "block";
      downloadBtn.href = data.mediaBase64;
      downloadBtn.download = data.filename || `converted_${Date.now()}.${format === "vn" ? "ogg" : "mp3"}`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Konversi Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Konversi Media Sekarang";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 9. OCR Scanner Studio (2-Kolom Ekstraksi)
// ==========================================================================
function initOcrStudio() {
  const fileInput = document.getElementById("ocrFileInput");
  const processBtn = document.getElementById("btnProcessOcr");
  const resultText = document.getElementById("ocrResultText");
  const copyBtn = document.getElementById("btnCopyOcr");

  if (!processBtn) return;
  let base64Image = null;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      base64Image = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    if (!base64Image) {
      alert("Pilih file gambar/foto terlebih dahulu!");
      return;
    }

    processBtn.textContent = "🔍 Menganalisis Teks (Tesseract)...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal membaca teks");

      resultText.value = data.text;
    } catch (err) {
      alert(`OCR Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "🔍 Ekstrak Teks Sekarang";
      processBtn.disabled = false;
    }
  });

  copyBtn.addEventListener("click", () => {
    resultText.select();
    navigator.clipboard.writeText(resultText.value);
    const old = copyBtn.textContent;
    copyBtn.textContent = "✅ Teks Berhasil Disalin!";
    setTimeout(() => {
      copyBtn.textContent = old;
    }, 2000);
  });
}

// ==========================================================================
// 10. Cek Tagihan Listrik PLN Studio (2-Kolom Struk)
// ==========================================================================
function initPlnStudio() {
  const checkBtn = document.getElementById("btnCheckPln");
  const nopelInput = document.getElementById("plnNopelInput");
  const placeholder = document.getElementById("plnPlaceholder");
  const table = document.getElementById("plnTable");
  const copyBtn = document.getElementById("btnCopyPln");

  if (!checkBtn) return;

  checkBtn.addEventListener("click", async () => {
    const nopel = nopelInput.value.trim();
    if (!nopel) {
      alert("Masukkan nomor ID pelanggan PLN!");
      return;
    }

    checkBtn.textContent = "⏳ Memeriksa Server PLN...";
    checkBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nopel }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal memeriksa tagihan PLN");

      const info = data.data;
      document.getElementById("plnNama").textContent = info.namaPelanggan || "-";
      document.getElementById("plnId").textContent = info.noPelanggan || nopel;
      document.getElementById("plnTarif").textContent = info.tarifDaya || "-";
      document.getElementById("plnPeriode").textContent = info.bulanTahun || "-";
      document.getElementById("plnMeter").textContent = info.standMeter || "-";
      document.getElementById("plnTotal").textContent = info.totalTagihan || "Rp 0";

      placeholder.style.display = "none";
      table.style.display = "table";
      copyBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Pemeriksaan Gagal: ${err.message}`);
    } finally {
      checkBtn.textContent = "🔍 Periksa Tagihan Sekarang";
      checkBtn.disabled = false;
    }
  });

  copyBtn.addEventListener("click", () => {
    const info = `Tagihan PLN:\nNama: ${document.getElementById("plnNama").textContent}\nID: ${document.getElementById("plnId").textContent}\nTarif: ${document.getElementById("plnTarif").textContent}\nTotal: ${document.getElementById("plnTotal").textContent}`;
    navigator.clipboard.writeText(info);
    const old = copyBtn.textContent;
    copyBtn.textContent = "✅ Rincian Disalin!";
    setTimeout(() => {
      copyBtn.textContent = old;
    }, 2000);
  });
}

// ==========================================================================
// ==========================================================================
// 11. Converter File Studio (Interactive Visual Pills & Dropzone)
// ==========================================================================
// ==========================================================================
// 11. Converter File Studio (Simple & Clean Dropdowns)
// ==========================================================================
function initPdfStudio() {
  const fromSelect = document.getElementById("convertFromFile");
  const toSelect = document.getElementById("convertToFile");
  const swapBtn = document.getElementById("btnSwapDirection");

  const dropzone = document.getElementById("dropzoneBox");
  const dropzoneTitle = document.getElementById("dropzoneTitle");
  const dropzoneExtBadge = document.getElementById("dropzoneExtBadge");
  const dropzoneIcon = document.getElementById("dropzoneIcon");
  const fileInput = document.getElementById("docFileInput");
  const fileLabel = document.getElementById("docFileLabel");

  const selectedFileCard = document.getElementById("selectedFileCard");
  const selectedFileName = document.getElementById("selectedFileName");
  const selectedFileSize = document.getElementById("selectedFileSize");
  const selectedFileIcon = document.getElementById("selectedFileIcon");
  const removeFileBtn = document.getElementById("btnRemoveFile");

  const processBtn = document.getElementById("btnProcessDoc");

  const idleState = document.getElementById("docIdleState");
  const processingState = document.getElementById("docProcessingState");
  const successCard = document.getElementById("docSuccessCard");

  const resultIcon = document.getElementById("docResultIcon");
  const resultName = document.getElementById("docResultName");
  const resultMeta = document.getElementById("docResultMeta");
  const downloadBtn = document.getElementById("btnDownloadDoc");
  const resetBtn = document.getElementById("btnResetConverter");

  if (!processBtn) return;

  let currentFileBase64 = null;
  let currentFileName = "";

  const formatConfig = {
    pdf: {
      name: "PDF",
      icon: "📕",
      accept: ".pdf,application/pdf",
      badge: "Menerima berkas: .pdf",
    },
    word: {
      name: "Word",
      icon: "📘",
      accept: ".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      badge: "Menerima berkas: .docx, .doc",
    },
    excel: {
      name: "Excel",
      icon: "📗",
      accept: ".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      badge: "Menerima berkas: .xlsx, .xls",
    },
    pptx: {
      name: "PPTX",
      icon: "📙",
      accept: ".pptx,.ppt,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
      badge: "Menerima berkas: .pptx, .ppt",
    },
    gambar: {
      name: "Gambar",
      icon: "🖼️",
      accept: "image/*,.png,.jpg,.jpeg,.webp",
      badge: "Menerima berkas: .png, .jpg, .jpeg, .webp",
    },
  };

  function syncUi() {
    const fromVal = fromSelect.value;
    const toVal = toSelect.value;
    const fromCfg = formatConfig[fromVal] || formatConfig.word;
    const toCfg = formatConfig[toVal] || formatConfig.pdf;

    if (fileLabel) fileLabel.textContent = `Unggah Berkas ${fromCfg.name} :`;
    if (dropzoneTitle) dropzoneTitle.innerHTML = `Tarik file ${fromCfg.name} ke sini atau <span class="dropzone-browse-link">klik untuk memilih</span>`;
    if (dropzoneExtBadge) dropzoneExtBadge.textContent = fromCfg.badge;
    if (dropzoneIcon) dropzoneIcon.textContent = fromCfg.icon;
    if (fileInput) fileInput.accept = fromCfg.accept;

    if (processBtn && !processBtn.disabled) {
      processBtn.textContent = `⚡ Mulai Konversi (${fromCfg.name} ➔ ${toCfg.name})`;
    }

    if (selectedFileIcon) selectedFileIcon.textContent = fromCfg.icon;
  }

  fromSelect.addEventListener("change", () => {
    if (fromSelect.value === toSelect.value) {
      toSelect.value = fromSelect.value === "pdf" ? "word" : "pdf";
    }
    syncUi();
  });

  toSelect.addEventListener("change", () => {
    if (toSelect.value === fromSelect.value) {
      fromSelect.value = toSelect.value === "pdf" ? "word" : "pdf";
    }
    syncUi();
  });

  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      syncUi();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      currentFileBase64 = reader.result;
    };
    reader.readAsDataURL(file);

    dropzone.style.display = "none";
    selectedFileCard.style.display = "flex";
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = (file.size > 1024 * 1024)
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    const fromCfg = formatConfig[fromSelect.value] || formatConfig.word;
    selectedFileIcon.textContent = fromCfg.icon;
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener("click", () => {
      currentFileBase64 = null;
      currentFileName = "";
      fileInput.value = "";
      selectedFileCard.style.display = "none";
      dropzone.style.display = "block";
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentFileBase64 = null;
      currentFileName = "";
      fileInput.value = "";
      selectedFileCard.style.display = "none";
      dropzone.style.display = "block";

      successCard.style.display = "none";
      processingState.style.display = "none";
      idleState.style.display = "block";
      syncUi();
    });
  }

  processBtn.addEventListener("click", async () => {
    if (!currentFileBase64 || !currentFileName) {
      alert("Silakan pilih berkas terlebih dahulu!");
      return;
    }

    const fromType = fromSelect.value;
    const toType = toSelect.value;

    if (fromType === toType) {
      alert("Format asal ('Dari file') dan format tujuan ('Ke file') tidak boleh sama!");
      return;
    }

    const fromCfg = formatConfig[fromType] || formatConfig.word;
    const toCfg = formatConfig[toType] || formatConfig.pdf;

    idleState.style.display = "none";
    successCard.style.display = "none";
    processingState.style.display = "block";

    processBtn.textContent = `⏳ Mengonversi ${fromCfg.name} ke ${toCfg.name}...`;
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/docconvert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: currentFileBase64,
          filename: currentFileName,
          fromType,
          toType,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal mengonversi file");

      setTimeout(() => {
        processingState.style.display = "none";
        successCard.style.display = "block";

        const ext = (data.format || toType).toLowerCase();
        let icon = "📄";
        if (ext === "docx" || ext === "doc") icon = "📝";
        else if (ext === "xlsx" || ext === "xls") icon = "📊";
        else if (ext === "pptx" || ext === "ppt") icon = "📽️";
        else if (ext === "png" || ext === "jpg" || ext === "jpeg") icon = "🖼️";

        resultIcon.textContent = icon;
        resultName.textContent = data.filename || `hasil_konversi.${ext}`;
        resultMeta.textContent = `Format: ${ext.toUpperCase()} | Ukuran: ${(data.size / 1024).toFixed(1)} KB`;

        downloadBtn.href = data.fileBase64;
        downloadBtn.download = data.filename || `dokumen_konversi.${ext}`;
      }, 300);

    } catch (err) {
      processingState.style.display = "none";
      idleState.style.display = "block";
      alert(`Konversi Gagal: ${err.message}`);
    } finally {
      processBtn.disabled = false;
      syncUi();
    }
  });

  syncUi();
}

// ==========================================================================
// 12. Brat Video Studio (MP4 Animasi)
// ==========================================================================
function initBratVideoStudio() {
  const textInput = document.getElementById("bratVidTextInput");
  const chipsContainer = document.getElementById("bratVidColorChips");
  const processBtn = document.getElementById("btnProcessBratVid");
  const placeholder = document.getElementById("bratVidPlaceholder");
  const player = document.getElementById("bratVidPlayer");
  const downloadBtn = document.getElementById("btnDownloadBratVid");

  if (!processBtn) return;

  let currentVidColor = "#FFFFFF";

  if (chipsContainer) {
    chipsContainer.innerHTML = "";
    Object.entries(BRAT_COLORS).forEach(([name, hex]) => {
      const chip = document.createElement("div");
      chip.className = `color-chip ${hex === "#FFFFFF" ? "active" : ""}`;
      chip.style.backgroundColor = hex;
      chip.title = name;
      chip.onclick = () => {
        document.querySelectorAll("#bratVidColorChips .color-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        currentVidColor = hex;
      };
      chipsContainer.appendChild(chip);
    });
  }

  processBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (!text) {
      alert("Masukkan teks untuk video Brat!");
      return;
    }

    processBtn.textContent = "⏳ Merender Video Animasi MP4 (Local FFmpeg)...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/bratvid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, color: currentVidColor }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal membuat video Brat");

      const videoSrc = data.videoBase64 || data.mediaBase64;
      placeholder.style.display = "none";
      player.src = videoSrc;
      player.style.display = "block";
      player.load();

      downloadBtn.href = videoSrc;
      downloadBtn.download = `brat_video_${Date.now()}.mp4`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Buat Video Brat (MP4)";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 13. Quote Chat Maker (QC Studio)
// ==========================================================================
function initQuoteChatStudio() {
  const nameInput = document.getElementById("qcNameInput");
  const textInput = document.getElementById("qcTextInput");
  const avatarInput = document.getElementById("qcAvatarInput");
  const processBtn = document.getElementById("btnProcessQc");
  const placeholder = document.getElementById("qcPlaceholder");
  const resultImg = document.getElementById("qcResultImg");
  const downloadBtn = document.getElementById("btnDownloadQc");

  if (!processBtn) return;

  let avatarBase64 = null;
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      avatarBase64 = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      avatarBase64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    const name = nameInput.value.trim() || "Novemas Heka";
    if (!text) {
      alert("Masukkan teks quote terlebih dahulu!");
      return;
    }

    processBtn.textContent = "⏳ Membuat Gelembung Chat...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text, avatarBase64 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal membuat Quote Chat");

      const imgSrc = data.imageBase64 || data.image;
      placeholder.style.display = "none";
      resultImg.src = imgSrc;
      resultImg.style.display = "block";

      downloadBtn.href = imgSrc;
      downloadBtn.download = `qc_${Date.now()}.png`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Buat Quote Chat";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 14. Penjernih Foto AI (HDR & Upscale)
// ==========================================================================
function initHdrStudio() {
  const fileInput = document.getElementById("hdrFileInput");
  const processBtn = document.getElementById("btnProcessHdr");
  const placeholder = document.getElementById("hdrPlaceholder");
  const resultImg = document.getElementById("hdrResultImg");
  const downloadBtn = document.getElementById("btnDownloadHdr");

  if (!processBtn) return;

  let imageBase64 = null;
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      imageBase64 = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imageBase64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    if (!imageBase64) {
      alert("Pilih foto yang ingin dijernihkan terlebih dahulu!");
      return;
    }

    const scaleRadio = document.querySelector('input[name="hdrScale"]:checked');
    const scale = scaleRadio ? parseInt(scaleRadio.value) : 2;

    processBtn.textContent = "⏳ Memproses Real-ESRGAN AI (Meningkatkan Resolusi)...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/hdr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, scale }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal menjernihkan foto");

      const imgSrc = data.imageBase64 || data.image;
      placeholder.style.display = "none";
      resultImg.src = imgSrc;
      resultImg.style.display = "block";

      downloadBtn.href = imgSrc;
      downloadBtn.download = `hdr_${scale}x_${Date.now()}.png`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Tingkatkan Resolusi Foto";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 15. Pewarna Foto Jadul (Recolor AI)
// ==========================================================================
function initRecolorStudio() {
  const fileInput = document.getElementById("recolorFileInput");
  const processBtn = document.getElementById("btnProcessRecolor");
  const placeholder = document.getElementById("recolorPlaceholder");
  const resultImg = document.getElementById("recolorResultImg");
  const downloadBtn = document.getElementById("btnDownloadRecolor");

  if (!processBtn) return;

  let imageBase64 = null;
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      imageBase64 = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imageBase64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    if (!imageBase64) {
      alert("Pilih foto hitam-putih terlebih dahulu!");
      return;
    }

    processBtn.textContent = "⏳ Menganalisis & Memberi Warna Alami...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/recolor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal mewarnai foto");

      const imgSrc = data.imageBase64 || data.image;
      placeholder.style.display = "none";
      resultImg.src = imgSrc;
      resultImg.style.display = "block";

      downloadBtn.href = imgSrc;
      downloadBtn.download = `recolored_${Date.now()}.png`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Beri Warna Gambar Sekarang";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 16. WhatsApp Sticker Maker (SWM Studio)
// ==========================================================================
function initStickerMakerStudio() {
  const fileInput = document.getElementById("smFileInput");
  const packInput = document.getElementById("smPackInput");
  const authorInput = document.getElementById("smAuthorInput");
  const processBtn = document.getElementById("btnProcessSticker");
  const placeholder = document.getElementById("stickerPlaceholder");
  const resultImg = document.getElementById("stickerResultImg");
  const downloadBtn = document.getElementById("btnDownloadSticker");

  if (!processBtn) return;

  let imageBase64 = null;
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      imageBase64 = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imageBase64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  processBtn.addEventListener("click", async () => {
    if (!imageBase64) {
      alert("Pilih gambar atau foto untuk stiker!");
      return;
    }

    const pack = packInput.value.trim() || "HekaTools Web";
    const author = authorInput.value.trim() || "Novemas Heka";

    processBtn.textContent = "⏳ Mengonversi ke Format WebP Resmi...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/sticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, pack, author }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal membuat stiker");

      const stickerSrc = data.stickerBase64 || data.image || data.mediaBase64;
      placeholder.style.display = "none";
      resultImg.src = stickerSrc;
      resultImg.style.display = "block";

      downloadBtn.href = stickerSrc;
      downloadBtn.download = `sticker_${Date.now()}.webp`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Buat Stiker WebP Sekarang";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 17. AI Image Generator Studio (Text-to-Image via FLUX)
// ==========================================================================
function initImageGenStudio() {
  const promptInput = document.getElementById("imgGenPrompt");
  const styleSelect = document.getElementById("imgGenStyle");
  const ratioSelect = document.getElementById("imgGenRatio");
  const processBtn = document.getElementById("btnGenerateImage");
  const placeholder = document.getElementById("imgGenPlaceholder");
  const resultImg = document.getElementById("imgGenResultImg");
  const downloadBtn = document.getElementById("btnDownloadImgGen");

  if (!processBtn) return;

  processBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert("Masukkan deskripsi gambar yang ingin dibuat!");
      return;
    }

    const style = styleSelect.value;
    const ratioParts = ratioSelect.value.split("x");
    const width = parseInt(ratioParts[0], 10) || 1024;
    const height = parseInt(ratioParts[1], 10) || 1024;

    processBtn.textContent = "🎨 AI Sedang Melukis Gambar (FLUX)...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/imagegen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, width, height }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal generate gambar AI");

      placeholder.style.display = "none";
      resultImg.src = data.imageBase64;
      resultImg.style.display = "block";

      downloadBtn.href = data.imageBase64;
      downloadBtn.download = `hekatools_ai_image_${Date.now()}.jpg`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Generate Gambar AI Sekarang";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 18. QR Code Studio (Generator & Scanner)
// ==========================================================================
function initQrStudio() {
  const tabGen = document.getElementById("tabQrGen");
  const tabScan = document.getElementById("tabQrScan");
  const genPanel = document.getElementById("qrGenPanel");
  const scanPanel = document.getElementById("qrScanPanel");

  if (tabGen && tabScan && genPanel && scanPanel) {
    tabGen.addEventListener("click", () => {
      tabGen.classList.add("active");
      tabScan.classList.remove("active");
      genPanel.style.display = "grid";
      scanPanel.style.display = "none";
    });

    tabScan.addEventListener("click", () => {
      tabScan.classList.add("active");
      tabGen.classList.remove("active");
      scanPanel.style.display = "grid";
      genPanel.style.display = "none";
    });
  }

  // QR Generator
  const typeSelect = document.getElementById("qrTypeSelect");
  const contentInput = document.getElementById("qrContentInput");
  const inputLabel = document.getElementById("qrInputLabel");
  const colorInput = document.getElementById("qrColorInput");
  const bgColorInput = document.getElementById("qrBgColorInput");
  const createBtn = document.getElementById("btnCreateQr");
  const placeholder = document.getElementById("qrPlaceholder");
  const resultImg = document.getElementById("qrResultImg");
  const downloadBtn = document.getElementById("btnDownloadQr");

  if (typeSelect && contentInput) {
    typeSelect.addEventListener("change", () => {
      const val = typeSelect.value;
      if (val === "url") {
        inputLabel.textContent = "Tautan URL / Website:";
        contentInput.placeholder = "https://contoh-website.com";
      } else if (val === "whatsapp") {
        inputLabel.textContent = "Nomor WhatsApp (dengan kode negara):";
        contentInput.placeholder = "628123456789";
      } else if (val === "wifi") {
        inputLabel.textContent = "Nama WiFi & Password (SSID,Password):";
        contentInput.placeholder = "NamaWiFi,PasswordRahasia";
      } else {
        inputLabel.textContent = "Isi Teks Bebas:";
        contentInput.placeholder = "Ketik teks pesan apa saja...";
      }
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const rawText = contentInput.value.trim();
      if (!rawText) {
        alert("Masukkan konten atau tautan terlebih dahulu!");
        return;
      }

      let payloadText = rawText;
      const type = typeSelect ? typeSelect.value : "url";
      if (type === "whatsapp") {
        const cleanPhone = rawText.replace(/[^0-9]/g, "");
        payloadText = `https://wa.me/${cleanPhone}`;
      } else if (type === "wifi") {
        const parts = rawText.split(",");
        const ssid = parts[0]?.trim() || "WiFi";
        const pass = parts[1]?.trim() || "";
        payloadText = `WIFI:T:WPA;S:${ssid};P:${pass};;`;
      }

      createBtn.textContent = "⏳ Membuat QR Code...";
      createBtn.disabled = true;

      try {
        const res = await fetch("/api/tools/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: payloadText,
            color: colorInput.value,
            bgcolor: bgColorInput.value,
            size: "350x350",
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Gagal membuat QR Code");

        placeholder.style.display = "none";
        resultImg.src = data.imageBase64;
        resultImg.style.display = "block";

        downloadBtn.href = data.imageBase64;
        downloadBtn.download = `qrcode_${Date.now()}.png`;
        downloadBtn.style.display = "inline-flex";
      } catch (err) {
        alert(`Gagal: ${err.message}`);
      } finally {
        createBtn.textContent = "⚡ Buat QR Code";
        createBtn.disabled = false;
      }
    });
  }

  // QR Scanner
  const scanFileInput = document.getElementById("qrScanFileInput");
  const scanBtn = document.getElementById("btnScanQr");
  const scanResultText = document.getElementById("qrScanResultText");
  const scanActions = document.getElementById("qrScanActions");
  const copyResultBtn = document.getElementById("btnCopyQrResult");
  const openUrlBtn = document.getElementById("btnOpenQrUrl");

  let scanImageBase64 = null;
  if (scanFileInput) {
    scanFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        scanImageBase64 = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        scanImageBase64 = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (scanBtn) {
    scanBtn.addEventListener("click", async () => {
      if (!scanImageBase64) {
        alert("Pilih file gambar QR Code terlebih dahulu!");
        return;
      }

      scanBtn.textContent = "🔍 Memindai QR Code...";
      scanBtn.disabled = true;

      try {
        // Coba scan di browser jika BarcodeDetector didukung
        let detectedText = null;
        if ("BarcodeDetector" in window) {
          try {
            const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
            const img = new Image();
            img.src = scanImageBase64;
            await new Promise(r => { img.onload = r; });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0) {
              detectedText = barcodes[0].rawValue;
            }
          } catch (e) {
            // fallback
          }
        }

        // Jika tidak didukung BarcodeDetector, gunakan endpoint OCR
        if (!detectedText) {
          const res = await fetch("/api/tools/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: scanImageBase64 }),
          });
          const data = await res.json();
          if (data.success && data.text) {
            detectedText = data.text.trim();
          }
        }

        if (detectedText) {
          scanResultText.textContent = detectedText;
          scanActions.style.display = "flex";

          if (/^https?:\/\//i.test(detectedText)) {
            openUrlBtn.href = detectedText;
            openUrlBtn.style.display = "inline-flex";
          } else {
            openUrlBtn.style.display = "none";
          }

          copyResultBtn.onclick = () => {
            navigator.clipboard.writeText(detectedText);
            copyResultBtn.textContent = "✅ Tersalin!";
            setTimeout(() => { copyResultBtn.textContent = "📋 Salin Teks"; }, 2000);
          };
        } else {
          scanResultText.textContent = "Tidak dapat membaca QR code dari gambar ini. Pastikan gambar jelas dan tidak terlalu buram.";
          scanActions.style.display = "none";
        }
      } catch (err) {
        alert(`Gagal: ${err.message}`);
      } finally {
        scanBtn.textContent = "🔍 Pindai & Baca Isi QR Code";
        scanBtn.disabled = false;
      }
    });
  }
}

// ==========================================================================
// 19. Text-to-Speech Studio (Voice MP3)
// ==========================================================================
function initTtsStudio() {
  const textInput = document.getElementById("ttsTextInput");
  const langSelect = document.getElementById("ttsLangSelect");
  const playBtn = document.getElementById("btnPlayTts");
  const stopBtn = document.getElementById("btnStopTts");
  const audioPlayer = document.getElementById("ttsAudioPlayer");
  const downloadBtn = document.getElementById("btnDownloadTts");
  const placeholder = document.getElementById("ttsPlaceholder");

  if (!playBtn) return;

  playBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (!text) {
      alert("Masukkan teks yang ingin diubah menjadi suara!");
      return;
    }

    const lang = langSelect.value;

    // 1. Putar langsung di browser via Web Speech API
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "id" ? "id-ID" : lang === "ja" ? "ja-JP" : lang === "ar" ? "ar-SA" : (lang === "en-gb" ? "en-GB" : "en-US");
      window.speechSynthesis.speak(u);
    }

    // 2. Dapatkan file MP3 dari server untuk player & tombol unduh
    playBtn.textContent = "⏳ Mengolah Audio...";
    playBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal memproses audio TTS");

      placeholder.style.display = "none";
      audioPlayer.src = data.audioBase64;
      audioPlayer.style.display = "block";
      audioPlayer.play().catch(() => {});

      downloadBtn.href = data.audioBase64;
      downloadBtn.download = `suara_tts_${Date.now()}.mp3`;
      downloadBtn.style.display = "inline-flex";
    } catch (err) {
      console.warn("TTS MP3 download error:", err.message);
    } finally {
      playBtn.textContent = "▶️ Putar Suara";
      playBtn.disabled = false;
    }
  });

  stopBtn.addEventListener("click", () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
  });
}

// ==========================================================================
// 20. Shortlink URL Generator Studio
// ==========================================================================
function initShortlinkStudio() {
  const urlInput = document.getElementById("shortlinkLongUrl");
  const processBtn = document.getElementById("btnProcessShortlink");
  const placeholder = document.getElementById("shortlinkPlaceholder");
  const resultCard = document.getElementById("shortlinkResultCard");
  const resultInput = document.getElementById("shortlinkResultInput");
  const copyBtn = document.getElementById("btnCopyShortlink");
  const visitBtn = document.getElementById("btnVisitShortlink");

  if (!processBtn) return;

  processBtn.addEventListener("click", async () => {
    let rawUrl = urlInput.value.trim();
    if (!rawUrl) {
      alert("Masukkan tautan URL yang ingin dipendekkan!");
      return;
    }

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = "https://" + rawUrl;
    }

    processBtn.textContent = "⏳ Memendekkan URL...";
    processBtn.disabled = true;

    try {
      const res = await fetch("/api/tools/shortlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal memendekkan tautan");

      placeholder.style.display = "none";
      resultInput.value = data.shortUrl;
      visitBtn.href = data.shortUrl;
      resultCard.style.display = "block";

      copyBtn.onclick = () => {
        navigator.clipboard.writeText(data.shortUrl);
        copyBtn.textContent = "✅ Tersalin!";
        setTimeout(() => { copyBtn.textContent = "📋 Salin"; }, 2000);
      };
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      processBtn.textContent = "⚡ Pendekkan URL Sekarang";
      processBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 21. Portal Religi & Ibadah Studio (Al-Qur'an, Sholat, Alkitab)
// ==========================================================================
function initReligiStudio() {
  const tabQuran = document.getElementById("tabQuran");
  const tabPrayer = document.getElementById("tabPrayer");
  const tabBible = document.getElementById("tabBible");

  const quranPanel = document.getElementById("quranPanel");
  const prayerPanel = document.getElementById("prayerPanel");
  const biblePanel = document.getElementById("biblePanel");

  if (!tabQuran) return;

  function switchReligiTab(activeTab, activePanel) {
    [tabQuran, tabPrayer, tabBible].forEach((t) => t && t.classList.remove("active"));
    [quranPanel, prayerPanel, biblePanel].forEach((p) => p && (p.style.display = "none"));
    if (activeTab) activeTab.classList.add("active");
    if (activePanel) activePanel.style.display = "block";
  }

  tabQuran.addEventListener("click", () => switchReligiTab(tabQuran, quranPanel));
  tabPrayer.addEventListener("click", () => {
    switchReligiTab(tabPrayer, prayerPanel);
    if (!prayerLoaded) {
      loadPrayerTimes("Jakarta");
    }
  });
  tabBible.addEventListener("click", () => switchReligiTab(tabBible, biblePanel));

  // 1. Al-Qur'an Digital
  const surahSelect = document.getElementById("quranSurahSelect");
  const ayatInput = document.getElementById("quranAyatInput");
  const readBtn = document.getElementById("btnReadQuran");
  const surahHeader = document.getElementById("quranSurahHeader");
  const surahTitle = document.getElementById("quranSurahTitle");
  const surahSubtitle = document.getElementById("quranSurahSubtitle");
  const surahArabic = document.getElementById("quranSurahArabic");
  const ayatContainer = document.getElementById("quranAyatContainer");

  let surahListLoaded = false;
  async function loadSurahList() {
    if (surahListLoaded || !surahSelect) return;
    try {
      const res = await fetch("/api/tools/quran/surahs");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        surahSelect.innerHTML = data.data.map((s) =>
          `<option value="${s.nomor}">${s.nomor}. ${s.namaLatin} (${s.arti} - ${s.jumlahAyat} Ayat)</option>`
        ).join("");
        surahListLoaded = true;
      }
    } catch (e) {
      surahSelect.innerHTML = '<option value="1">1. Al-Fatihah (Pembukaan)</option>';
    }
  }
  loadSurahList();

  if (readBtn) {
    readBtn.addEventListener("click", async () => {
      const surahNum = surahSelect.value || "1";
      const targetAyat = parseInt(ayatInput.value, 10);

      readBtn.textContent = "⏳ Membaca...";
      readBtn.disabled = true;
      ayatContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">⏳ Memuat ayat-ayat suci Al-Qur\'an...</div>';

      try {
        const res = await fetch(`/api/tools/quran/detail?surah=${encodeURIComponent(surahNum)}`);
        const data = await res.json();
        if (!data.success || !data.data) throw new Error(data.error || "Gagal memuat surat Al-Qur'an");

        const detail = data.data;
        if (surahHeader) {
          surahHeader.style.display = "block";
          surahTitle.textContent = `${detail.nomor}. ${detail.namaLatin} (${detail.arti})`;
          surahSubtitle.textContent = `${(detail.tempatTurun || "").toUpperCase()} • ${detail.jumlahAyat} Ayat`;
          surahArabic.textContent = detail.nama;
        }

        const ayatList = detail.ayat || [];
        if (!ayatList.length) {
          ayatContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">Ayat tidak ditemukan.</div>';
          return;
        }

        ayatContainer.innerHTML = ayatList.map((a) => {
          const isHighlighted = targetAyat && a.nomorAyat === targetAyat;
          return `
            <div id="ayat-${a.nomorAyat}" class="ayat-card" style="background: var(--surface); border: 1px solid ${isHighlighted ? 'var(--accent)' : 'var(--line)'}; border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; transition: transform 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="background: ${isHighlighted ? 'var(--accent)' : 'var(--surface-alt)'}; color: ${isHighlighted ? '#fff' : 'var(--accent)'}; font-size: 0.78rem; font-weight: 700; padding: 2px 10px; border-radius: 12px; border: 1px solid var(--accent);">Ayat ${a.nomorAyat}</span>
                <button class="btn-copy-ayat" data-copy="${escapeHtml(a.teksArab + '\n\n' + a.teksIndonesia)}" style="background: transparent; border: 1px solid var(--line); color: var(--text-muted); cursor: pointer; border-radius: var(--radius-sm); padding: 4px 8px; font-size: 0.8rem;">📋 Salin</button>
              </div>
              <div style="font-size: 1.55rem; font-family: 'Amiri', 'Traditional Arabic', serif; line-height: 2.3; text-align: right; color: var(--text-color); margin-bottom: 10px;" dir="rtl">${a.teksArab}</div>
              <div style="font-size: 0.88rem; color: var(--accent); font-style: italic; margin-bottom: 6px; line-height: 1.4;">${a.teksLatin}</div>
              <div style="font-size: 0.92rem; color: var(--text-color); line-height: 1.55;">${a.teksIndonesia}</div>
            </div>
          `;
        }).join("");

        ayatContainer.querySelectorAll(".btn-copy-ayat").forEach((btn) => {
          btn.addEventListener("click", () => {
            const txt = btn.getAttribute("data-copy");
            navigator.clipboard.writeText(txt);
            btn.textContent = "✅ Tersalin!";
            setTimeout(() => { btn.textContent = "📋 Salin"; }, 2000);
          });
        });

        if (targetAyat) {
          const targetEl = document.getElementById(`ayat-${targetAyat}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch (err) {
        ayatContainer.innerHTML = `<div style="text-align: center; color: var(--rose); padding: 30px;">⚠️ ${escapeHtml(err.message)}</div>`;
      } finally {
        readBtn.textContent = "📖 Buka Surat";
        readBtn.disabled = false;
      }
    });
  }

  // 2. Jadwal Sholat Kota
  const cityInput = document.getElementById("prayerCityInput");
  const searchPrayerBtn = document.getElementById("btnSearchPrayer");
  const prayerResultCard = document.getElementById("prayerResultCard");
  const prayerCityTitle = document.getElementById("prayerCityTitle");
  const prayerDateHijri = document.getElementById("prayerDateHijri");
  const prayerDateMasehi = document.getElementById("prayerDateMasehi");

  const timeImsak = document.getElementById("timeImsak");
  const timeSubuh = document.getElementById("timeSubuh");
  const timeTerbit = document.getElementById("timeTerbit");
  const timeDzuhur = document.getElementById("timeDzuhur");
  const timeAshar = document.getElementById("timeAshar");
  const timeMaghrib = document.getElementById("timeMaghrib");
  const timeIsya = document.getElementById("timeIsya");

  let prayerLoaded = false;
  async function loadPrayerTimes(cityName) {
    const city = (cityName || (cityInput ? cityInput.value : "Jakarta")).trim() || "Jakarta";
    if (searchPrayerBtn) {
      searchPrayerBtn.textContent = "⏳ Mencari...";
      searchPrayerBtn.disabled = true;
    }

    try {
      const res = await fetch(`/api/tools/prayer?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (!data.success || !data.data) throw new Error(data.error || "Jadwal sholat tidak ditemukan");

      const t = data.data;
      if (prayerResultCard) prayerResultCard.style.display = "block";
      if (prayerCityTitle) prayerCityTitle.textContent = `Kota ${t.city}${t.province && t.province !== '-' ? ', ' + t.province : ''}`;
      if (prayerDateHijri) prayerDateHijri.textContent = t.tanggalHijriah || "Tanggal Hijriah";
      if (prayerDateMasehi) prayerDateMasehi.textContent = t.tanggalMasehi || "Hari Ini";

      if (timeImsak) timeImsak.textContent = t.imsak || "--:--";
      if (timeSubuh) timeSubuh.textContent = t.subuh || "--:--";
      if (timeTerbit) timeTerbit.textContent = t.terbit || "--:--";
      if (timeDzuhur) timeDzuhur.textContent = t.dzuhur || "--:--";
      if (timeAshar) timeAshar.textContent = t.ashar || "--:--";
      if (timeMaghrib) timeMaghrib.textContent = t.maghrib || "--:--";
      if (timeIsya) timeIsya.textContent = t.isya || "--:--";

      prayerLoaded = true;
    } catch (err) {
      alert(`Jadwal Sholat: ${err.message}`);
    } finally {
      if (searchPrayerBtn) {
        searchPrayerBtn.textContent = "🔍 Cari Jadwal";
        searchPrayerBtn.disabled = false;
      }
    }
  }

  if (searchPrayerBtn) searchPrayerBtn.addEventListener("click", () => loadPrayerTimes());
  if (cityInput) {
    cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") loadPrayerTimes();
    });
  }

  // 3. Alkitab Digital
  const bibleInput = document.getElementById("biblePassageInput");
  const searchBibleBtn = document.getElementById("btnSearchBible");
  const bibleContainer = document.getElementById("bibleVerseContainer");

  async function loadBiblePassage() {
    const passage = (bibleInput ? bibleInput.value : "").trim();
    if (!passage) {
      alert("Masukkan referensi kitab dan pasal (contoh: Yohanes 3:16)!");
      return;
    }

    if (searchBibleBtn) {
      searchBibleBtn.textContent = "⏳ Mencari...";
      searchBibleBtn.disabled = true;
    }
    bibleContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">⏳ Memuat ayat Alkitab...</div>';

    try {
      const res = await fetch(`/api/tools/alkitab?passage=${encodeURIComponent(passage)}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error(data.error || "Ayat tidak ditemukan");

      bibleContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--line); padding-bottom: 8px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--accent);">${escapeHtml(data.passage || passage)}</h3>
          <button id="btnCopyAllBible" class="btn-solid" style="padding: 4px 10px; font-size: 0.82rem;">📋 Salin Semua</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${data.data.map(v => `
            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 12px;">
              <span style="font-weight: 700; color: var(--accent); margin-right: 8px;">[${escapeHtml(v.ref)}]</span>
              <span style="line-height: 1.6; color: var(--text-color);">${escapeHtml(v.text)}</span>
            </div>
          `).join("")}
        </div>
      `;

      const copyAllBtn = document.getElementById("btnCopyAllBible");
      if (copyAllBtn) {
        copyAllBtn.addEventListener("click", () => {
          const fullText = data.data.map(v => `[${v.ref}] ${v.text}`).join("\n");
          navigator.clipboard.writeText(`${data.passage || passage}\n\n${fullText}`);
          copyAllBtn.textContent = "✅ Tersalin!";
          setTimeout(() => { copyAllBtn.textContent = "📋 Salin Semua"; }, 2000);
        });
      }
    } catch (err) {
      bibleContainer.innerHTML = `<div style="text-align: center; color: var(--rose); padding: 20px;">⚠️ ${escapeHtml(err.message)}</div>`;
    } finally {
      if (searchBibleBtn) {
        searchBibleBtn.textContent = "🔍 Cari Ayat";
        searchBibleBtn.disabled = false;
      }
    }
  }

  if (searchBibleBtn) searchBibleBtn.addEventListener("click", loadBiblePassage);
  if (bibleInput) {
    bibleInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") loadBiblePassage();
    });
  }
}

// ==========================================================================
// 22. Kamus KBBI & Ensiklopedia Wikipedia Studio
// ==========================================================================
function initEncyclopediaStudio() {
  const tabKbbi = document.getElementById("tabKbbi");
  const tabWiki = document.getElementById("tabWiki");
  const kbbiPanel = document.getElementById("kbbiPanel");
  const wikiPanel = document.getElementById("wikiPanel");

  if (!tabKbbi) return;

  tabKbbi.addEventListener("click", () => {
    tabKbbi.classList.add("active");
    if (tabWiki) tabWiki.classList.remove("active");
    if (kbbiPanel) kbbiPanel.style.display = "block";
    if (wikiPanel) wikiPanel.style.display = "none";
  });

  if (tabWiki) {
    tabWiki.addEventListener("click", () => {
      tabWiki.classList.add("active");
      tabKbbi.classList.remove("active");
      if (wikiPanel) wikiPanel.style.display = "block";
      if (kbbiPanel) kbbiPanel.style.display = "none";
    });
  }

  // 1. KBBI
  const kbbiInput = document.getElementById("kbbiInput");
  const searchKbbiBtn = document.getElementById("btnSearchKbbi");
  const kbbiResultBox = document.getElementById("kbbiResultBox");

  async function searchKbbi() {
    const word = (kbbiInput ? kbbiInput.value : "").trim();
    if (!word) {
      alert("Masukkan kata yang ingin dicari di KBBI!");
      return;
    }

    if (searchKbbiBtn) {
      searchKbbiBtn.textContent = "⏳ Mencari...";
      searchKbbiBtn.disabled = true;
    }
    kbbiResultBox.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">⏳ Membaca Kamus Besar Bahasa Indonesia...</div>';

    try {
      const res = await fetch(`/api/tools/kbbi?q=${encodeURIComponent(word)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Definisi kata tidak ditemukan di KBBI");

      kbbiResultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem; color: var(--accent); text-transform: capitalize;">${escapeHtml(data.word)}</h3>
            <span style="font-size: 0.8rem; background: var(--surface); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--line);">KBBI Daring</span>
          </div>
          <button id="btnCopyKbbi" class="btn-solid" style="padding: 4px 10px; font-size: 0.82rem;">📋 Salin Arti</button>
        </div>
        <p style="font-size: 1rem; line-height: 1.7; color: var(--text-color); margin: 0;">${escapeHtml(data.definition)}</p>
      `;

      const copyBtn = document.getElementById("btnCopyKbbi");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(`${data.word}: ${data.definition}`);
          copyBtn.textContent = "✅ Tersalin!";
          setTimeout(() => { copyBtn.textContent = "📋 Salin Arti"; }, 2000);
        });
      }
    } catch (err) {
      kbbiResultBox.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 20px;">⚠️ ${escapeHtml(err.message)}</div>`;
    } finally {
      if (searchKbbiBtn) {
        searchKbbiBtn.textContent = "🔍 Cari di KBBI";
        searchKbbiBtn.disabled = false;
      }
    }
  }

  if (searchKbbiBtn) searchKbbiBtn.addEventListener("click", searchKbbi);
  if (kbbiInput) {
    kbbiInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchKbbi();
    });
  }

  // 2. Wikipedia
  const wikiInput = document.getElementById("wikiInput");
  const searchWikiBtn = document.getElementById("btnSearchWiki");
  const wikiResultBox = document.getElementById("wikiResultBox");

  async function searchWiki() {
    const q = (wikiInput ? wikiInput.value : "").trim();
    if (!q) {
      alert("Masukkan topik ensiklopedia Wikipedia!");
      return;
    }

    if (searchWikiBtn) {
      searchWikiBtn.textContent = "⏳ Mencari...";
      searchWikiBtn.disabled = true;
    }
    wikiResultBox.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">⏳ Membaca ringkasan artikel Wikipedia...</div>';

    try {
      const res = await fetch(`/api/tools/wikipedia?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.success || !data.data) throw new Error(data.error || "Artikel tidak ditemukan di Wikipedia Indonesia");

      const item = data.data;
      wikiResultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem; color: var(--accent);">${escapeHtml(item.title)}</h3>
            <span style="font-size: 0.8rem; background: var(--surface); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--line);">Wikipedia Indonesia</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btnCopyWiki" class="btn-solid" style="padding: 4px 10px; font-size: 0.82rem;">📋 Salin</button>
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="padding: 4px 10px; font-size: 0.82rem; text-decoration: none;">🔗 Buka Web</a>
          </div>
        </div>
        <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-color); margin: 0;">${escapeHtml(item.extract || "Ringkasan teks tidak tersedia.")}</p>
      `;

      const copyBtn = document.getElementById("btnCopyWiki");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(`${item.title}\n\n${item.extract}\n\nSumber: ${item.url}`);
          copyBtn.textContent = "✅ Tersalin!";
          setTimeout(() => { copyBtn.textContent = "📋 Salin"; }, 2000);
        });
      }
    } catch (err) {
      wikiResultBox.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 20px;">⚠️ ${escapeHtml(err.message)}</div>`;
    } finally {
      if (searchWikiBtn) {
        searchWikiBtn.textContent = "🔍 Cari di Wikipedia";
        searchWikiBtn.disabled = false;
      }
    }
  }

  if (searchWikiBtn) searchWikiBtn.addEventListener("click", searchWiki);
  if (wikiInput) {
    wikiInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchWiki();
    });
  }
}

// ==========================================================================
// 23. Cuaca & Kode Pos Indonesia Studio
// ==========================================================================
function initGeoInfoStudio() {
  const tabWeather = document.getElementById("tabWeather");
  const tabKodepos = document.getElementById("tabKodepos");
  const weatherPanel = document.getElementById("weatherPanel");
  const kodeposPanel = document.getElementById("kodeposPanel");

  if (!tabWeather) return;

  tabWeather.addEventListener("click", () => {
    tabWeather.classList.add("active");
    if (tabKodepos) tabKodepos.classList.remove("active");
    if (weatherPanel) weatherPanel.style.display = "block";
    if (kodeposPanel) kodeposPanel.style.display = "none";
  });

  if (tabKodepos) {
    tabKodepos.addEventListener("click", () => {
      tabKodepos.classList.add("active");
      tabWeather.classList.remove("active");
      if (kodeposPanel) kodeposPanel.style.display = "block";
      if (weatherPanel) weatherPanel.style.display = "none";
    });
  }

  // 1. Cuaca Kota
  const weatherInput = document.getElementById("weatherCityInput");
  const searchWeatherBtn = document.getElementById("btnSearchWeather");
  const weatherResultBox = document.getElementById("weatherResultBox");

  async function checkWeather(cityName) {
    const city = (cityName || (weatherInput ? weatherInput.value : "Jakarta")).trim() || "Jakarta";
    if (searchWeatherBtn) {
      searchWeatherBtn.textContent = "⏳ Mengecek...";
      searchWeatherBtn.disabled = true;
    }
    weatherResultBox.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 25px;">⏳ Mengambil data cuaca real-time...</div>';

    try {
      const res = await fetch(`/api/tools/weather?q=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (!data.success || !data.data) throw new Error(data.error || "Data cuaca tidak ditemukan");

      const w = data.data;
      weatherResultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-color);">${escapeHtml(w.location)}</h3>
            <span style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(w.localTime || "")}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 2rem; font-weight: 800; color: var(--accent); line-height: 1;">${w.temperature}&deg;C <span style="font-size: 1rem; font-weight: 500; color: var(--text-muted);">(${w.tempF}&deg;F)</span></div>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-color); margin-top: 4px;">${escapeHtml(w.condition)} • Terasa ${w.feelsLikeC}&deg;C</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">KELEMBAPAN</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-top: 2px;">${w.humidity}%</div>
          </div>
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">PELUANG HUJAN</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-top: 2px;">${w.rainChance}%</div>
          </div>
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">KECEPATAN ANGIN</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-top: 2px;">${w.windSpeed} mph ${w.windDir}</div>
          </div>
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">INDEKS UV</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-top: 2px;">${w.uv} (${escapeHtml(w.uvCategory)})</div>
          </div>
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">TERBIT MATAHARI</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-top: 2px;">${w.sunrise || "-"}</div>
          </div>
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">TERBENAM</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-top: 2px;">${w.sunset || "-"}</div>
          </div>
        </div>
      `;
    } catch (err) {
      weatherResultBox.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 25px;">⚠️ ${escapeHtml(err.message)}</div>`;
    } finally {
      if (searchWeatherBtn) {
        searchWeatherBtn.textContent = "🔍 Cek Cuaca";
        searchWeatherBtn.disabled = false;
      }
    }
  }

  if (searchWeatherBtn) searchWeatherBtn.addEventListener("click", () => checkWeather());
  if (weatherInput) {
    weatherInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkWeather();
    });
  }

  // 2. Kode Pos Indonesia
  const kodeposInput = document.getElementById("kodeposQueryInput");
  const searchKodeposBtn = document.getElementById("btnSearchKodepos");
  const kodeposResultBox = document.getElementById("kodeposResultBox");

  async function searchKodepos() {
    const q = (kodeposInput ? kodeposInput.value : "").trim();
    if (!q) {
      alert("Masukkan nama kelurahan, kecamatan, kota, atau nomor kode pos 5 digit!");
      return;
    }

    if (searchKodeposBtn) {
      searchKodeposBtn.textContent = "⏳ Mencari...";
      searchKodeposBtn.disabled = true;
    }
    kodeposResultBox.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">⏳ Membaca database pos se-Indonesia...</div>';

    try {
      const res = await fetch(`/api/tools/kodepos?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data) || !data.data.length) {
        throw new Error(`Tidak ditemukan hasil untuk "${q}". Coba kata kunci yang lebih spesifik.`);
      }

      kodeposResultBox.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">Ditemukan ${data.data.length} hasil untuk "${escapeHtml(q)}":</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${data.data.map(item => `
            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.1rem; font-weight: 800; color: var(--accent); letter-spacing: 0.5px;">📮 ${escapeHtml(item.postalCode || "-")}</span>
                  ${item.village ? `<span style="font-weight: 600; color: var(--text-color);">${escapeHtml(item.village)}</span>` : ""}
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 3px;">
                  Kec: ${escapeHtml(item.district || "-")} • Kota/Kab: ${escapeHtml(item.city || "-")} • Prov: ${escapeHtml(item.province || "-")}
                </div>
              </div>
              <button class="btn-copy-kodepos" data-code="${escapeHtml(item.postalCode)}" style="background: var(--surface-alt); border: 1px solid var(--line); color: var(--text-color); cursor: pointer; border-radius: var(--radius-sm); padding: 4px 10px; font-size: 0.8rem;">📋 Salin Kode</button>
            </div>
          `).join("")}
        </div>
      `;

      kodeposResultBox.querySelectorAll(".btn-copy-kodepos").forEach(btn => {
        btn.addEventListener("click", () => {
          const code = btn.getAttribute("data-code");
          navigator.clipboard.writeText(code);
          btn.textContent = "✅ Tersalin!";
          setTimeout(() => { btn.textContent = "📋 Salin Kode"; }, 2000);
        });
      });
    } catch (err) {
      kodeposResultBox.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 20px;">⚠️ ${escapeHtml(err.message)}</div>`;
    } finally {
      if (searchKodeposBtn) {
        searchKodeposBtn.textContent = "🔍 Cari Kode Pos";
        searchKodeposBtn.disabled = false;
      }
    }
  }

  if (searchKodeposBtn) searchKodeposBtn.addEventListener("click", searchKodepos);
  if (kodeposInput) {
    kodeposInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchKodepos();
    });
  }
}

// ==========================================================================
// 24. Pencari Lirik Lagu Studio
// ==========================================================================
function initLyricsStudio() {
  const artistInput = document.getElementById("lyricsArtistInput");
  const titleInput = document.getElementById("lyricsTitleInput");
  const searchBtn = document.getElementById("btnSearchLyrics");
  const resultCard = document.getElementById("lyricsResultCard");
  const displayTitle = document.getElementById("lyricsDisplayTitle");
  const displayArtist = document.getElementById("lyricsDisplayArtist");
  const lyricsContent = document.getElementById("lyricsContentText");
  const copyBtn = document.getElementById("btnCopyLyrics");
  const placeholder = document.getElementById("lyricsPlaceholder");

  if (!searchBtn) return;

  async function searchLyrics() {
    const artist = (artistInput ? artistInput.value : "").trim();
    const title = (titleInput ? titleInput.value : "").trim();

    if (!title) {
      alert("Masukkan judul lagu yang ingin dicari!");
      if (titleInput) titleInput.focus();
      return;
    }

    searchBtn.textContent = "⏳ Mencari Lirik...";
    searchBtn.disabled = true;

    try {
      const res = await fetch(`/api/tools/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (!data.success || !data.lyrics) {
        throw new Error(data.error || `Lirik lagu "${title}" tidak ditemukan. Pastikan judul dan nama artis sudah benar.`);
      }

      if (placeholder) placeholder.style.display = "none";
      if (resultCard) resultCard.style.display = "block";

      if (displayTitle) displayTitle.textContent = data.title || title;
      if (displayArtist) displayArtist.textContent = data.artist || (artist || "Artis");
      if (lyricsContent) lyricsContent.textContent = data.lyrics;

      if (copyBtn) {
        copyBtn.onclick = () => {
          const textToCopy = `${data.title} - ${data.artist}\n\n${data.lyrics}`;
          navigator.clipboard.writeText(textToCopy);
          copyBtn.textContent = "✅ Tersalin!";
          setTimeout(() => { copyBtn.textContent = "📋 Salin Lirik"; }, 2000);
        };
      }
    } catch (err) {
      alert(`Pencarian Lirik: ${err.message}`);
    } finally {
      searchBtn.textContent = "🔍 Cari Lirik";
      searchBtn.disabled = false;
    }
  }

  searchBtn.addEventListener("click", searchLyrics);
  if (artistInput) {
    artistInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchLyrics();
    });
  }
  if (titleInput) {
    titleInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchLyrics();
    });
  }
}
