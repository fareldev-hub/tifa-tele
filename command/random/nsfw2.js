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

    // 🔒 Cek uang
    let price = "15000"
    if (user.uang <= price) {
      return ctx.reply(
        isIndo
          ? `🚫 Saldo kamu tidak cukup ini membutuhkan Rp${price} uang. silahkan /topup untuk menambah uang kamu.`
          : `🚫 Your balance is insufficient, this requires Rp${price}. Please top up to add more money.`,
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
      caption: isIndo ? `🔞 NSFW Random\n\n💎 Harga : -Rp${price}` : `🔞 Random NSFW\n\n💎 Price : -Rp${price}`,
      reply_to_message_id: ctx.message?.message_id
    });

    user.uang -= price;
    saveUser(ctx.from.id, user);

    // Hapus loading
    try { await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id); } catch (_) { }

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
