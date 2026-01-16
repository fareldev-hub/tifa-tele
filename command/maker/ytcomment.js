const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    
    if (user.limit <= 0) {
      const msg = isIndo
        ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
        : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }
    
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /ytcomment <teks>\nContoh: `/ytcomment farel ganteng`"
          : "💡 Use format: /ytcomment <text>\nExample: `/ytcomment farel ganteng`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // ⏳ Kirim pesan loading
    await ctx.reply(
      lang === "id"
        ? "💬 Sedang membuat komentar YouTube..."
        : "💬 Generating YouTube comment...",
      { reply_to_message_id: ctx.message?.message_id }
    );
    
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 🧩 Ambil avatar dari profil Telegram user
    const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, { limit: 1 });
    let avatarUrl = "https://files.catbox.moe/1l6trg.jpg"; // default

    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      const file = await ctx.telegram.getFile(fileId);
      avatarUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;
    }

    const username = ctx.from.first_name || "Anon";
    const text = args;

    // 🔗 API endpoint
    const apiUrl = `https://api.deline.web.id/maker/ytcomment?text=${encodeURIComponent(
      text
    )}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatarUrl)}`;

    // 🔄 Fetch hasil gambar
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image")) {
      throw new Error("API tidak mengembalikan gambar yang valid.");
    }

    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // 📸 Kirim hasilnya
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption:
          lang === "id"
            ? "✅ *Selesai membuat komentar!*"
            : "✅ *Comment generated successfully!*",
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ Error di ytcomment.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat komentar 😥"
        : "❌ An error occurred while generating the comment 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
