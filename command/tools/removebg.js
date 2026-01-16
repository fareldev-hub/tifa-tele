const fetch = require("node-fetch");
const { Markup } = require("telegraf");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    // cek limit
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    let fileId;
    let userCaption = "";

    const messageText = ctx.message.text || "";

    if (ctx.message.reply_to_message) {
      const reply = ctx.message.reply_to_message;
      userCaption = messageText.replace(/^\/removebg\s*/i, "").trim();

      if (reply.photo) {
        const photo = reply.photo[reply.photo.length - 1];
        fileId = photo.file_id;
      } else if (reply.document) {
        fileId = reply.document.file_id;
      } else {
        return ctx.reply(
          isIndo
            ? "⚠️ Balasan tidak berisi foto atau dokumen."
            : "⚠️ The reply does not contain a photo or document.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }
    } else {
      userCaption = messageText.replace(/^\/removebg\s*/i, "").trim();

      if (ctx.message.photo) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        fileId = photo.file_id;
      } else if (ctx.message.document) {
        fileId = ctx.message.document.file_id;
      } else {
        return ctx.reply(
          isIndo
            ? "⚠️ Kirim foto atau reply /removebg pada foto."
            : "⚠️ Send a photo or reply /removebg to a photo.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }
    }

    await ctx.reply(
      isIndo
        ? "⏳ Menghapus background, mohon tunggu..."
        : "⏳ Removing background, please wait...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // kurangi limit
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // API remove bg
    const apiUrl = `https://api.nekolabs.web.id/tools/pxpic/removebg?imageUrl=${encodeURIComponent(fileLink.href)}`;
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json.success || !json.result) {
      throw new Error(isIndo ? "Gagal menghapus background." : "Failed to remove background.");
    }

    // Caption dengan penyesuaian bahasa
    let caption = isIndo ? "✅ Background berhasil dihapus!" : "✅ Background successfully removed!";
    if (userCaption) caption += isIndo ? "\n📝 Caption: " + userCaption : "\n📝 Caption: " + userCaption;
    caption += isIndo
      ? "\n🌐 Hasil dengan latar belakang terhapus dapat diunduh melalui tombol di bawah:"
      : "\n🌐 The result with the background removed can be downloaded via the button below:";

    const buttons = Markup.inlineKeyboard([
      Markup.button.url(isIndo ? "📥 Unduh" : "📥 Download", json.result)
    ]);

    // Kirim foto hasil remove bg dengan tombol
    await ctx.replyWithPhoto(
      { url: json.result },
      { caption, reply_markup: buttons.reply_markup, reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di /removebg:", err);
    ctx.reply(
      isIndo
        ? "❌ Gagal menghapus background, coba lagi."
        : "❌ Failed to remove background, please try again.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
