const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const replyMsg = ctx.message.reply_to_message;
    const hasCaption = ctx.message.caption?.toLowerCase().includes("/dewatermark");
    const isCommand = ctx.message.text?.startsWith("/dewatermark");

    let fileUrl;

    // 🔹 Jika membalas foto
    if (replyMsg?.photo) {
      const photo = replyMsg.photo[replyMsg.photo.length - 1];
      const file = await ctx.telegram.getFile(photo.file_id);
      fileUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;
    }
    // 🔹 Jika kirim foto dengan caption
    else if (ctx.message.photo && hasCaption) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const file = await ctx.telegram.getFile(photo.file_id);
      fileUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;
    }

    // 🔹 Tidak ada gambar
    if (!fileUrl) {
      return ctx.reply(
        isIndo
          ? "📸 Balas gambar dengan /dewatermark untuk menghapus watermark!"
          : "📸 Reply to an image with /dewatermark to remove its watermark!",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Cek saldo
    if (user.uang < 15000) {
      return ctx.reply(
        isIndo
          ? "💸 Saldo kamu tidak cukup (butuh Rp15.000)."
          : "💸 Not enough balance (need Rp15,000).",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Pesan loading
    const loadingMsg = await ctx.reply(
      isIndo ? "🧼 Menghapus watermark, tunggu sebentar..." : "🧼 Removing watermark, please wait...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔹 Panggil API
    const apiUrl = `https://api.siputzx.my.id/api/tools/dewatermark?url=${encodeURIComponent(fileUrl)}`;
    const res = await fetch(apiUrl);

    // 🔍 Deteksi jenis konten
    const contentType = res.headers.get("content-type");
    let buffer;

    if (contentType.includes("application/json")) {
      // Kadang API memang mengirim JSON hasil
      const data = await res.json();
      if (!data.status || !data.result?.url) {
        throw new Error("Invalid JSON result");
      }
      const imgRes = await fetch(data.result.url);
      buffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      // Jika langsung gambar (binary)
      buffer = Buffer.from(await res.arrayBuffer());
    }

    // 🔹 Kirim hasil ke user
    await ctx.replyWithPhoto({ source: buffer }, {
      caption: isIndo
        ? "✅ Watermark berhasil dihapus!\n💰 Rp15.000 telah dipotong dari saldo kamu."
        : "✅ Watermark removed successfully!\n💰 Rp15,000 deducted from your balance.",
      reply_to_message_id: ctx.message?.message_id
    });

    // 🔹 Kurangi saldo
    user.uang -= 15000;
    saveUser(ctx.from.id, user);

    // 🔹 Hapus pesan loading
    ctx.deleteMessage(loadingMsg.message_id).catch(() => {});

    console.log(`🧽 Dewatermark success for ${ctx.from.first_name}, saldo: ${user.uang}`);
  } catch (err) {
    console.error("❌ Error di /dewatermark:", err);
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    ctx.reply(
      isIndo
        ? "❌ Terjadi kesalahan saat menghapus watermark. Coba lagi nanti!"
        : "❌ Error while removing watermark. Please try again later!",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
