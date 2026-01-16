const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    // Ambil teks dari perintah
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan: /3dtext <teks>\nContoh: /3dtext Halo Dunia"
          : "💡 Usage: /3dtext <text>\nExample: /3dtext Hello World",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Load user & cek limit
    const user = loadUser(ctx.from.id) || { limit: 0 };
    const cost = 5;
    if ((user.limit || 0) < cost) {
      return ctx.reply(
        isIndo
          ? `🚫 Kamu butuh minimal ${cost} limit untuk menggunakan fitur ini. Sisa limit: ${user.limit || 0}`
          : `🚫 You need at least ${cost} limit to use this feature. Remaining limit: ${user.limit || 0}`,
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Kirim pesan loading
    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Membuat gambar..." : "⏳ Generating image...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Panggil API (tanpa mengurangi limit dulu)
    const apiUrl = `https://api.nekolabs.web.id/ephoto/3d-gradient-text?text=${encodeURIComponent(
      input
    )}`;
    const apiRes = await fetch(apiUrl);

    if (!apiRes.ok) throw new Error(`API error: ${apiRes.status}`);

    const buffer = Buffer.from(await apiRes.arrayBuffer());

    // ✅ Jika berhasil, baru kurangi limit dan simpan
    user.limit -= cost;
    saveUser(ctx.from.id, user);

    // Kirim hasil ke user
    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: isIndo
          ? `✨ 3D Text: ${input}`
          : `✨ 3D Text: ${input}`,
        reply_to_message_id: ctx.message?.message_id,
      }
    );
    
  } catch (err) {
    console.error("Error /3dtext:", err);
    await ctx.reply(
      (ctx.from.language_code || "en").startsWith("id")
        ? "⚠️ Gagal membuat gambar 3D. Coba lagi nanti."
        : "⚠️ Failed to generate 3D image. Please try again later.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
