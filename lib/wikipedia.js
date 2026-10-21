const axios = require("axios");

// Wikimedia mewajibkan User-Agent yang jelas sesuai User-Agent Policy
const HEADERS = { "User-Agent": "HekaTools/2.0 (https://hekaportfolio.web.app; contact@hekalabs.id)" };

/** Cari artikel Wikipedia Bahasa Indonesia, ambil ringkasannya */
async function searchWikipedia(query) {
  try {
    const res = await axios.get("https://id.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        format: "json",
        prop: "extracts|info",
        exintro: true,
        explaintext: true,
        inprop: "url",
        generator: "search",
        gsrsearch: query,
        gsrlimit: 1,
      },
      headers: HEADERS,
      timeout: 20000,
    });

    const pages = res.data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (!page || page.pageid === undefined) return null;

    return {
      title: page.title,
      extract: page.extract || "",
      url: page.fullurl || `https://id.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    };
  } catch {
    return null;
  }
}

module.exports = { searchWikipedia };

