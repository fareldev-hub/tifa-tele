const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id) || { limit: 0 };
    const cost = 1;

    // Cek limit
    if (user.limit < cost) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Loading
    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil gambar waifu..." : "⏳ Fetching waifu image...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Panggil API
    const res = await fetch("https://api.deline.web.id/random/waifu");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    let imageUrl;

    if (contentType && contentType.includes("application/json")) {
      // Kalau JSON → ambil result
      const data = await res.json();
      if (!data?.result) throw new Error("API tidak mengembalikan gambar valid");
      imageUrl = data.result;
    } else {
      // Kalau bukan JSON → langsung URL gambar
      imageUrl = res.url;
    }

    // Download gambar ke buffer
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Gagal download gambar: HTTP ${imgRes.status}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Kirim gambar
    await ctx.replyWithPhoto({ source: buffer }, {
      caption: "💖 Waifu random untukmu",
      reply_to_message_id: ctx.message?.message_id
    });

    // Kurangi limit
    user.limit -= cost;
    saveUser(ctx.from.id, user);

    // Hapus loading
    try { await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id); } catch (_) {}

  } catch (err) {
    console.error("❌ Error di /waitu:", err);
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    ctx.reply(
      isIndo
        ? "❌ Gagal mengambil gambar waifu 😥"
        : "❌ Failed to fetch waifu image 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
