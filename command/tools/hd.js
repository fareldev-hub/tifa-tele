const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    // cek limit
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
    
    const args = ctx.message.text.split(" ").slice(1);
    let scale = parseInt(args[0]);
    if (!scale || scale < 2 || scale > 8) scale = 2; // default 2x

    // Ambil file dari reply atau langsung
    let fileId;
    if (ctx.message.reply_to_message) {
      const reply = ctx.message.reply_to_message;
      if (reply.photo) {
        fileId = reply.photo[reply.photo.length - 1].file_id;
      } else if (reply.document && reply.document.mime_type.startsWith("image/")) {
        fileId = reply.document.file_id;
      } else {
        return ctx.reply(isIndo
          ? "⚠️ Balasan harus berupa gambar."
          : "⚠️ The reply must be an image.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }
    } else {
      return ctx.reply(isIndo
        ? "⚠️ Balas gambar dengan /hd <scale> atau sertakan gambar."
        : "⚠️ Reply to an image with /hd <scale> or send an image with the command.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    await ctx.reply(isIndo
      ? `⏳ Memproses gambar dengan scale ${scale}x...`
      : `⏳ Processing image with scale ${scale}x...`,
      { reply_to_message_id: ctx.message?.message_id }
    );
  

    // Ambil link file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Encode URL
    const encodedUrl = encodeURIComponent(fileLink.href);

    // Panggil API HD
    const apiUrl = `https://api.yupra.my.id/api/tools/hd?url=${encodedUrl}&scale=${scale}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.status !== 200 || !data.result) {
      return ctx.reply(isIndo
        ? "❌ Gagal memproses gambar. Coba lagi."
        : "❌ Failed to process image. Please try again.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const result = data.result;
    const caption = isIndo
      ? `✨ Gambar berhasil di-enhance ${result.scale}!\n\n📝 Info: ${result.info}\n💡 Catatan: ${result.note}`
      : `✨ Image successfully enhanced ${result.scale}!\n\n📝 Info: ${result.info}\n💡 Note: ${result.note}`;

    await ctx.replyWithPhoto(
      { url: result.imageUrl },
      {
        caption,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id
      }
    );
    user.limit -= 5;
    saveUser(ctx.from.id, user);

  } catch (err) {
    console.error("❌ Error di /hd:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat memproses /hd."
        : "❌ An error occurred while processing /hd.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
