/**
 * HekaTools - Web Media Studio & AI Portal
 * Entry point utama aplikasi web server.
 */
const { startServer } = require("./web/server");

startServer().catch((err) => {
  console.error("Gagal menjalankan server HekaTools:", err);
  process.exit(1);
});
