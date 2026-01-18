const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  const isIndo = (ctx.from?.language_code || "").startsWith("id");
  const replyId = ctx.message?.message_id;

  // opsi reply aman
  const replyOpts = {
    reply_to_message_id: replyId,
    allow_sending_without_reply: true
  };

  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam."
          : "🚫 Your limit has run out. Please wait 24 hours.",
        replyOpts
      );
    }

    let fileId;

    // ===============================
    // AMBIL GAMBAR DARI REPLY
    // ===============================
    if (ctx.message.reply_to_message) {
      const r = ctx.message.reply_to_message;
      if (r.photo) fileId = r.photo.at(-1).file_id;
      if (r.document?.mime_type?.startsWith("image/"))
        fileId = r.document.file_id;
    }

    // ===============================
    // AMBIL GAMBAR LANGSUNG
    // ===============================
    if (!fileId) {
      if (ctx.message.photo) fileId = ctx.message.photo.at(-1).file_id;
      if (ctx.message.document?.mime_type?.startsWith("image/"))
        fileId = ctx.message.document.file_id;
    }

    if (!fileId) {
      return ctx.reply(
        isIndo
          ? "⚠️ reply gambar dengan /removebg"
          : "⚠️ reply an image with /removebg",
        replyOpts
      );
    }

    // ===============================
    // PROSES
    // ===============================
    await ctx.reply("⏳ Processing...", replyOpts);

    const fileLink = await ctx.telegram.getFileLink(fileId);

    const apiUrl =
      `https://api.deline.web.id/tools/removebg?url=${encodeURIComponent(fileLink.href)}`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json.status || !json.result?.cutoutUrl) {
      throw new Error("RemoveBG API failed");
    }

    // ===============================
    // KURANGI LIMIT (SETELAH SUKSES)
    // ===============================
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // ===============================
    // KIRIM HASIL (LINK SAJA)
    // ===============================
    await ctx.reply(
      isIndo
        ? `✅ Background berhasil dihapus!\n\n<b>🔗 Hasil PNG:</b>\n<a href="${json.result.cutoutUrl}">Klik untuk mengunduh</a>`
        : `✅ Background successfully removed!\n\n<b>🔗 PNG Result:</b>\n<a href="${json.result.cutoutUrl}">Click to download</a>`,
      {
        ...replyOpts,
        parse_mode: "HTML",
        disable_web_page_preview: true
      }
    );


  } catch (err) {
    console.error("❌ Error di /removebg:", err);
    ctx.reply(
      isIndo
        ? "❌ Gagal menghapus background."
        : "❌ Failed to remove background.",
      replyOpts
    );
  }
};
