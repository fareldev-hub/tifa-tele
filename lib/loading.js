/**
 * 🌐 Universal Loading Utility
 * Realtime progress bar untuk semua command (ytmp4, ytmp3, downloader, dll)
 * Menggunakan stream event agar progres akurat.
 */

const fetch = require("node-fetch");

/**
 * Download file dengan progress bar realtime di Telegram
 * @param {Object} ctx - Context dari Telegraf
 * @param {Object} message - Pesan Telegram yang sedang diedit (hasil ctx.reply)
 * @param {string} url - URL file yang akan diunduh
 * @param {string} [text="📥 Downloading..."] - Teks utama untuk status
 * @param {Object} [options={}] - Opsi fetch (header, method, dll)
 * @returns {Promise<Buffer>} - Mengembalikan buffer file
 */
async function downloadWithProgress(ctx, message, url, text = "📥 Downloading...", options = {}) {
  const barLength = 15;
  const barChar = "▓";
  const emptyChar = "░";

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Gagal mengunduh: ${res.statusText}`);

  const total = parseInt(res.headers.get("content-length")) || 0;
  let downloaded = 0;
  let lastPercent = 0;
  const chunks = [];
  const startTime = Date.now();

  await new Promise((resolve, reject) => {
    res.body.on("data", async (chunk) => {
      chunks.push(chunk);
      downloaded += chunk.length;

      if (total > 0) {
        const percent = Math.floor((downloaded / total) * 100);
        const elapsed = (Date.now() - startTime) / 1000; // detik
        const speed = downloaded / 1024 / elapsed; // KB/s
        const eta = (total - downloaded) / 1024 / speed; // detik

        if (percent - lastPercent >= 5 || percent === 100) {
          lastPercent = percent;
          const filled = Math.round((percent / 100) * barLength);
          const bar = `${barChar.repeat(filled)}${emptyChar.repeat(barLength - filled)}`;
          const speedStr = speed > 1024 ? `${(speed / 1024).toFixed(1)} MB/s` : `${speed.toFixed(0)} KB/s`;
          const etaStr = eta > 60 ? `${Math.round(eta / 60)}m` : `${Math.round(eta)}s`;

          try {
            await ctx.telegram.editMessageText(
              ctx.chat.id,
              message.message_id,
              undefined,
              `${text}\n[${bar}] ${percent}%\n⚡ ${speedStr} | ⏳ ETA: ${etaStr}`
            );
          } catch {}
        }
      }
    });

    res.body.on("end", resolve);
    res.body.on("error", reject);
  });

  try {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      message.message_id,
      undefined,
      `${text}\n[${barChar.repeat(barLength)}] 100%`
    );
  } catch {}

  return Buffer.concat(chunks);
}

/**
 * Fungsi loading umum (tanpa download)
 * Menampilkan animasi progress sederhana untuk operasi berat non-stream
 */
async function showLoading(ctx, message, text = "⏳ Loading...", duration = 5000) {
  const frames = ["▱▱▱▱▱", "▰▱▱▱▱", "▰▰▱▱▱", "▰▰▰▱▱", "▰▰▰▰▱", "▰▰▰▰▰"];
  const steps = frames.length;
  let current = 0;
  const interval = setInterval(async () => {
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        message.message_id,
        undefined,
        `${text}\n${frames[current]}`
      );
      current = (current + 1) % steps;
    } catch {}
  }, duration / steps);

  return new Promise((resolve) =>
    setTimeout(async () => {
      clearInterval(interval);
      try {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          message.message_id,
          undefined,
          `${text}\n✅ Selesai!`
        );
      } catch {}
      resolve();
    }, duration)
  );
}

module.exports = { downloadWithProgress, showLoading };
