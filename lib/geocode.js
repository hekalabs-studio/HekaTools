const axios = require("axios");

// SEBELUMNYA: lib/weather.js (.cuaca) dan lib/prayerTimes.js (.jadwalsalat) masing-masing punya
// kode geocoding sendiri-sendiri yang IDENTIK (hit endpoint geocoding-api.open-meteo.com yang
// sama persis), dan gak ada cache sama sekali -- tiap kali command dipanggil, selalu nembak
// ulang request geocoding ke internet, padahal nama kota->koordinat itu data yang PRAKTIS GAK
// PERNAH BERUBAH. Ini boros banget karena pola pemakaian nyata: user yang sama sering nanya
// *.cuaca <kota>* abis itu *.jadwalsalat <kota>* (kota yang sama), atau banyak user beda nanya
// kota yang sama (kota sendiri/kota besar) berkali-kali dari waktu ke waktu.
//
// Modul ini gabungin logic geocoding jadi SATU tempat (gak duplikat lagi di 2 file) + tambahin
// cache in-memory per nama kota, biar lookup kota yang sama ke-2/ke-3 dst kalinya gak perlu
// nembak API sama sekali -- langsung dari memory, jauh lebih cepat dan gak nambah beban ke
// Open-Meteo. Cache di-key pakai nama kota yang di-normalize (lowercase+trim) biar
// "Klakah"/"klakah"/" Klakah " dianggap kota yang sama, gak ke-cache terpisah percuma.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 jam -- cukup lama (koordinat kota gak berubah),
// tapi tetap ada batas (bukan cache permanen) jaga-jaga kalau suatu saat butuh data ke-refresh
// tanpa restart bot (konsisten sama pola surahListCache di lib/quran.js).
const cache = new Map(); // key: nama kota ternormalisasi -> { place, cachedAt }

function normalizeKey(cityName) {
  return String(cityName).trim().toLowerCase();
}

/**
 * Cari koordinat + info lokasi dari nama kota lewat Open-Meteo Geocoding API.
 * Return null kalau kota gak ketemu. Hasil di-cache in-memory (lihat catatan di atas).
 */
async function geocodeCity(cityName) {
  const key = normalizeKey(cityName);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.place;
  }

  const geoRes = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
    params: { name: cityName, count: 1, language: "id" },
    timeout: 20000,
  });
  const place = geoRes.data?.results?.[0] || null;

  // Cache juga hasil "gak ketemu" (place = null) -- biar typo/nama kota yang emang gak ada di
  // database gak nembak API berkali-kali tiap dicoba lagi dalam rentang TTL yang sama.
  cache.set(key, { place, cachedAt: Date.now() });
  return place;
}

module.exports = { geocodeCity };
