const fetch = require("node-fetch");
const { performance } = require("perf_hooks");
const { loadUser } = require("../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    await ctx.reply(lang === "id" ? "🚀 Mengukur kecepatan internet..." : "🚀 Testing internet speed...");

    // 🔹 Gunakan URL dari Google dan Cloudflare
    const testUrls = [
      "https://storage.googleapis.com/generate_204", // file kecil (ping test)
      "https://speed.cloudflare.com/__down?bytes=5000000" // 5MB (download test)
    ];

    // =========================
    // PING TEST
    // =========================
    const pingStart = performance.now();
    await fetch(testUrls[0]);
    const pingEnd = performance.now();
    const ping = Math.round(pingEnd - pingStart);

    // =========================
    // DOWNLOAD TEST
    // =========================
    const dlStart = performance.now();
    const dlRes = await fetch(testUrls[1]);
    const dlBuffer = await dlRes.arrayBuffer();
    const dlEnd = performance.now();

    const dlMB = dlBuffer.byteLength / (1024 * 1024);
    const dlTime = (dlEnd - dlStart) / 1000;
    const downloadMbps = ((dlMB * 8) / dlTime).toFixed(2);

    // =========================
    // UPLOAD TEST (simulasi)
    // =========================
    const uploadData = Buffer.alloc(1 * 1024 * 1024); // 1MB data dummy
    const ulStart = performance.now();
    await fetch("https://httpbin.org/post", {
      method: "POST",
      body: uploadData,
      headers: { "Content-Type": "application/octet-stream" },
    });
    const ulEnd = performance.now();
    const ulTime = (ulEnd - ulStart) / 1000;
    const uploadMbps = ((1 * 8) / ulTime).toFixed(2);

    // =========================
    // Hasil Akhir
    // =========================
    const msg = lang === "id"
      ? `
📊 *Hasil Tes Kecepatan Internet*

📶 *Ping:* ${ping} ms  
⬇️ *Download:* ${downloadMbps} Mbps  
⬆️ *Upload:* ${uploadMbps} Mbps  

👤 *Pengguna:* ${user.name}  
💎 *Level:* ${user.level}

━━━━━━━━━━━━━━
⏱️ Tes selesai ✅
`
      : `
📊 *Internet Speed Test Result*

📶 *Ping:* ${ping} ms  
⬇️ *Download:* ${downloadMbps} Mbps  
⬆️ *Upload:* ${uploadMbps} Mbps  

👤 *User:* ${user.name}  
━━━━━━━━━━━━━━
⏱️ Test completed ✅
`;

    await ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.message?.message_id,
    });

  } catch (err) {
    console.error("❌ Error di /speed:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Gagal melakukan tes kecepatan internet. Silakan coba lagi nanti."
        : "❌ Failed to perform internet speed test. Please try again later."
    );
  }
};
