const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id) || { limit: 0 };
    const cost = 1; // limit per konversi

    // === Cek limit ===
    if (user.limit < cost) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Ambil gambar dari balasan ===
    let fileId;
    if (ctx.message.reply_to_message) {
      const reply = ctx.message.reply_to_message;
      if (reply.photo) {
        fileId = reply.photo[reply.photo.length - 1].file_id;
      } else if (reply.document && reply.document.mime_type.startsWith("image/")) {
        fileId = reply.document.file_id;
      } else {
        return ctx.reply(
          isIndo
            ? "⚠️ Balasan harus berupa gambar."
            : "⚠️ The reply must be an image.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }
    } else {
      return ctx.reply(
        isIndo
          ? "💡 Balas gambar dengan perintah /toprompt untuk mengubahnya menjadi deskripsi prompt."
          : "💡 Reply to an image with /toprompt to convert it into a text prompt.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Pesan loading ===
    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Menganalisis gambar dan membuat prompt..." : "⏳ Analyzing image and generating prompt...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // === Dapatkan link file Telegram ===
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const encodedUrl = encodeURIComponent(fileLink.href);

    // === Panggil API toprompt ===
    const apiUrl = `https://api.nekolabs.web.id/tools/convert/toprompt?imageUrl=${encodedUrl}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    console.log("🔍 API Response:", data);

    // === Tangani format respons fleksibel ===
    let promptText =
      data?.result?.prompt ||
      data?.result?.text ||
      data?.result ||
      data?.prompt ||
      data?.text ||
      null;

    // Jika hasil masih null, cek apakah API mengembalikan string langsung
    if (!promptText && typeof data === "string") {
      promptText = data;
    }

    // Jika tetap kosong → error
    if (!promptText || promptText.length < 3) {
      throw new Error("API tidak mengembalikan hasil valid");
    }

    // === Kurangi limit jika sukses ===
    user.limit -= cost;
    saveUser(ctx.from.id, user);

    // === Kirim hasil ke user ===
    const caption = isIndo
      ? `🧠 *Deskripsi Gambar:*\n${promptText}\n\n⭐ Limit dikurangi ${cost}. Sisa: ${user.limit}`
      : `🧠 *Image Description:*\n${promptText}\n\n⭐ Used ${cost} limit. Remaining: ${user.limit}`;

    await ctx.reply(caption, {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.message?.message_id,
    });

    // Hapus pesan loading
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
    } catch (_) {}

  } catch (err) {
    console.error("❌ Error di /toprompt:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Gagal memproses gambar menjadi prompt. Coba lagi nanti."
        : "❌ Failed to process image to prompt. Please try again later.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
