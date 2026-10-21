const httpClient = require("./httpClient"); // OPTIMIZATION: Use pooled HTTP client
const cheerio = require("cheerio");
const crypto = require("crypto");
const downloaderCache = require("./downloaderCache");
const { retryWithBackoff } = require("./retryHelper");

/**
 * Download video TEMPLATE dari CapCut (link kayak capcut.com/template/... atau short link
 * capcut.com/tv2/... capcut.com/t/...) -- BUKAN buat video biasa yang di-export/share user,
 * khusus buat template viral yang orang pakai buat bikin video serupa.
 *
 * Di-port dari implementasi nyata (github.com/siputzx/apisku/blob/master/router/downloader/capcut.ts),
 * disederhanakan (skip langkah getMeta() tambahan yang di source aslinya -- gak perlu, soalnya
 * data JSON-LD di langkah 2 di bawah udah lengkap buat kebutuhan kita: judul + URL video).
 *
 * Alur:
 * 1. Buka link CapCut-nya, ikutin semua redirect (short link -> URL lengkap ada template ID-nya).
 * 2. Extract template ID dari URL hasil redirect (pola: /template-detail/xxx/NNNN atau /templates/NNNN).
 * 3. Fetch https://www.capcut.com/templates/{templateId}, cari blok
 *    <script type="application/ld+json"> -- ini format terstruktur standar (schema.org
 *    VideoObject) yang CapCut taruh buat SEO, isinya field `contentUrl` (link video asli) +
 *    `name`/`description` (judul).
 */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

function makeUrlHash(url) {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
}

function extractTemplateId(redirectedUrl) {
  const numericMatch = redirectedUrl.match(/\/template-detail\/(?:[a-zA-Z0-9-]+)?\/(\d+)|\/templates\/(\d+)/);
  if (numericMatch) return numericMatch[1] || numericMatch[2];

  const stringIdMatch = redirectedUrl.match(/\/template-detail\/([a-zA-Z0-9-]+)/);
  if (stringIdMatch) return stringIdMatch[1];

  const urlParams = new URL(redirectedUrl).searchParams;
  const templateIdParam = urlParams.get("template_id");
  if (templateIdParam) return templateIdParam;

  return null;
}

/** @returns {Promise<{buffer: Buffer, title: string}>} */
async function downloadCapcutTemplate(capcutUrl) {
  // OPTIMIZATION: Check cache dulu
  const urlHash = makeUrlHash(capcutUrl);
  const cached = downloaderCache.get("capcut", urlHash);
  if (cached) {
    return cached;
  }

  // OPTIMIZATION: Retry 3x dengan exponential backoff
  const result = await retryWithBackoff(
    async () => {
      // Langkah 1+2: ikutin redirect, ambil template ID dari URL akhirnya
      const redirectRes = await httpClient.get(capcutUrl, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        maxRedirects: 10,
        timeout: 20000,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      const redirectedUrl = redirectRes.request?.res?.responseUrl || capcutUrl;
      const templateId = extractTemplateId(redirectedUrl);
      if (!templateId) {
        throw new Error(
          "Gak ketemu template ID dari link ini -- pastikan ini link TEMPLATE CapCut " +
          "(capcut.com/template/... atau short link capcut.com/t/...), bukan link video biasa."
        );
      }

      // Langkah 3: fetch halaman template lengkap, cari blok JSON-LD (VideoObject)
      const templateRes = await httpClient.get(`https://www.capcut.com/templates/${templateId}`, {
        headers: { "User-Agent": UA },
        timeout: 20000,
      });
      const $ = cheerio.load(templateRes.data);

      let videoData = null;
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          videoData = JSON.parse($(el).html());
          return false;
        } catch {
          // lanjut cek blok <script> berikutnya
        }
      });

      const videoUrl = videoData?.contentUrl || videoData?.embedUrl;
      if (!videoUrl) {
        throw new Error(
          "Ketemu halaman template-nya, tapi gak ketemu data video (blok JSON-LD kosong/gak ada " +
          "field contentUrl) -- kemungkinan struktur halaman CapCut udah berubah."
        );
      }

      const videoRes = await httpClient.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": UA },
      });
      return { buffer: Buffer.from(videoRes.data), title: videoData?.name || videoData?.description || "CapCut Template" };
    },
    3,    // max retries
    1000  // initial delay
  );

  // OPTIMIZATION: Cache hasil
  downloaderCache.set("capcut", urlHash, result);
  return result;
}

module.exports = { downloadCapcutTemplate };
