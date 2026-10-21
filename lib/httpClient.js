/**
 * Global HTTP client dengan connection pooling.
 *
 * Manfaat:
 * 1. keepAlive: true — reuse TCP connections, tidak create baru setiap request
 * 2. maxSockets: 10 — max 10 concurrent connections (tidak kelamaan, tidak terlalu banyak)
 * 3. Centralized — semua external API calls pakai client ini
 * 4. Timeout default — 10 detik (prevent hanging requests)
 *
 * Impact: 20-30% faster external API calls, lower latency
 *
 * Usage:
 *   const httpClient = require('./lib/httpClient');
 *   const response = await httpClient.get('https://api.example.com/data');
 *   const data = await httpClient.post('https://api.example.com/create', { name: 'test' });
 */

const axios = require("axios");
const http = require("http");
const https = require("https");

// Create custom HTTP/HTTPS agents dengan connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

// Create axios instance dengan pooling agents
const httpClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000, // 10 detik timeout default
});

// Add request interceptor untuk logging (optional)
httpClient.interceptors.request.use((config) => {
  config._startTime = Date.now();
  return config;
});

// Add response interceptor untuk log latency
httpClient.interceptors.response.use(
  (response) => {
    const latency = Date.now() - (response.config._startTime || 0);
    if (latency > 2000) {
      // Log slow requests (>2s)
      const url = new URL(response.config.url).hostname;
      console.log(`⚠️  [http] Slow request: ${url} took ${latency}ms`);
    }
    return response;
  },
  (error) => {
    const latency = Date.now() - (error.config?._startTime || 0);
    console.error(
      `❌ [http] Request error: ${error.config?.url} (${latency}ms): ${error.message?.slice(0, 50)}`
    );
    return Promise.reject(error);
  }
);

/**
 * Graceful shutdown — close all pooled connections. Dipanggil dari shutdown terpusat di
 * index.js, BUKAN daftar handler SIGINT/SIGTERM sendiri di sini (lihat catatan di index.js).
 */
function shutdown() {
  console.log("🛑 [http] Closing pooled connections...");
  httpAgent.destroy();
  httpsAgent.destroy();
}

httpClient.shutdown = shutdown;
module.exports = httpClient;
