const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id) || { limit: 0 };
    const cost = 1; // limit per penggunaan

    if (user.limit < cost) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil video aspupan..." : "⏳ Fetching random video...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // === Panggil API aspupan ===
    const res = await fetch("https://api.deline.web.id/random/asupan");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");

    let videoUrl;

    if (contentType && contentType.includes("application/json")) {
      // Kalau JSON → ambil URL
      const data = await res.json();
      if (!data?.result?.url) throw new Error("API tidak mengembalikan video valid");
      videoUrl = data.result.url;
    } else {
      // Kalau bukan JSON → langsung file, ambil URL asli
      videoUrl = res.url;
    }

    // Download video sebagai buffer agar Telegram stabil
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Gagal download video: HTTP ${videoRes.status}`);
    const buffer = Buffer.from(await videoRes.arrayBuffer());

    // Kirim video
    await ctx.replyWithVideo({ source: buffer }, {
      caption: isIndo ? "📹 Video Aspupan Random" : "📹 Random Aspupan Video",
      reply_to_message_id: ctx.message?.message_id
    });

    // Kurangi limit
    user.limit -= cost;
    saveUser(ctx.from.id, user);

    // Hapus loading
    try { await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id); } catch (_) {}

  } catch (err) {
    console.error("❌ Error di /aspupan:", err);
    ctx.reply(
      isIndo
        ? "❌ Gagal mengambil video aspupan 😥"
        : "❌ Failed to fetch random video 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
