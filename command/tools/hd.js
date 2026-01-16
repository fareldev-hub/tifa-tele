const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    let fileId;

    // Reply image
    if (ctx.message.reply_to_message) {
      const r = ctx.message.reply_to_message;
      if (r.photo) fileId = r.photo[r.photo.length - 1].file_id;
      else if (r.document?.mime_type?.startsWith("image/"))
        fileId = r.document.file_id;
    }

    // Image + caption /hd
    if (!fileId) {
      const caption = ctx.message.caption || ctx.message.text || "";
      if (caption.trim().startsWith("/hd")) {
        if (ctx.message.photo)
          fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        else if (ctx.message.document?.mime_type?.startsWith("image/"))
          fileId = ctx.message.document.file_id;
      }
    }

    if (!fileId) {
      return ctx.reply(
        isIndo
          ? "⚠️ Kirim gambar dengan caption /hd atau reply gambar dengan /hd"
          : "⚠️ Send an image with /hd caption or reply to an image with /hd",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    await ctx.reply(
      isIndo ? "⏳ Memproses gambar..." : "⏳ Processing image...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Telegram file link
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const encodedUrl = encodeURIComponent(fileLink.href);

    // Fetch HD image (BINARY)
    const apiUrl = `https://api.deline.web.id/tools/hd?url=${encodedUrl}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error("Failed to fetch HD image");
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: isIndo
          ? "✨ Gambar berhasil di-enhance!"
          : "✨ Image enhanced successfully!",
        reply_to_message_id: ctx.message?.message_id
      }
    );

    user.limit -= 5;
    saveUser(ctx.from.id, user);

  } catch (err) {
    console.error("❌ Error /hd:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat memproses gambar."
        : "❌ An error occurred while processing the image.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
