const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    if (ctx.chat.type !== "private") {
      return ctx.reply("🚫 Fitur NSFW hanya bisa digunakan di chat pribadi!");
    }

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

    // Loading
    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil NSFW random..." : "⏳ Fetching random NSFW...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Ambil gambar langsung (bukan JSON)
    const res = await fetch("https://api.deline.web.id/random/nsfw2");
    if (!res.ok) throw new Error(`HTTP ${res.status} saat fetch gambar`);

    const buffer = Buffer.from(await res.arrayBuffer());

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: isIndo ? "🔞 NSFW Random" : "🔞 Random NSFW",
      reply_to_message_id: ctx.message?.message_id
    });

    // Kurangi limit
    user.limit -= cost;
    saveUser(ctx.from.id, user);

    // Hapus loading
    try { await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id); } catch (_) {}

  } catch (err) {
    console.error("❌ Error di /nsfw2:", err);
    ctx.reply(
      isIndo
        ? "❌ Gagal mengambil gambar NSFW 😥"
        : "❌ Failed to fetch NSFW image 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
