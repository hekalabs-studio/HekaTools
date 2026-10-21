const axios = require("axios");

/**
 * Cek tagihan listrik PLN via nomor pelanggan (nopel) -- scraping listrik.okcek.com, layanan
 * publik gratis (bukan API resmi PLN, tapi salah satu yang paling stabil dipakai buat ini).
 *
 * Di-port dari implementasi nyata
 * (github.com/siputzx/apisku/blob/master/router/check/cektagihanpln.ts).
 */
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36";

/** @returns {Promise<{jenisTagihan, noPelanggan, namaPelanggan, tarifDaya, bulanTahun, standMeter, totalTagihan}>} */
async function cekTagihanPln(nopel) {
  const res = await axios.get("https://listrik.okcek.com/dd.php", {
    params: { nopel },
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: `https://listrik.okcek.com/hasil.php?nopel=${nopel}`,
      "User-Agent": UA,
      "X-Requested-With": "XMLHttpRequest",
    },
    timeout: 20000,
  });

  const rawData = res.data;
  if (rawData?.data?.status !== "success") {
    throw new Error("Nomor pelanggan gak ketemu/gak valid. Cek lagi nomornya.");
  }

  return {
    jenisTagihan: rawData.data[0][2],
    noPelanggan: rawData.data[1][2],
    namaPelanggan: rawData.data[2][2],
    tarifDaya: rawData.data[3][2],
    bulanTahun: rawData.data[4][2],
    standMeter: rawData.data[5][2],
    totalTagihan: rawData.data[6][2],
  };
}

module.exports = { cekTagihanPln };
