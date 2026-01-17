const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id) || { limit: 0 };
    const cost = 1; // limit per penggunaan

    // === Cek limit ===
    if (user.limit < cost) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Pesan loading
    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil PP Couple..." : "⏳ Fetching couple profile pictures...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // === Panggil API PPCouple ===
    const res = await fetch("https://api.deline.web.id/random/ppcouple");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data?.result?.cowo || !data?.result?.cewe) {
      throw new Error("API tidak mengembalikan gambar valid");
    }

    const cowoImg = data.result.cowo;
    const ceweImg = data.result.cewe;

    // Kirim sebagai album (media group) dan reply ke pesan pengguna
    await ctx.replyWithMediaGroup(
      [
        { type: "photo", media: cowoImg, caption: "👦 Cowok" },
        { type: "photo", media: ceweImg, caption: "👧 Cewek" }
      ],
      { reply_to_message_id: ctx.message?.message_id } // <-- ini tambahan
    );

    // Kurangi limit
    user.limit -= cost;
    saveUser(ctx.from.id, user);

    // Hapus pesan loading
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
    } catch (_) {}

  } catch (err) {
    console.error("❌ Error di /ppcouple:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Gagal mengambil PP Couple 😥"
        : "❌ Failed to fetch couple profile pictures 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
