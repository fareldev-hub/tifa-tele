const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { loadUser, saveUser } = require("../../handler");

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// 🔼 Upload ke ImgBB (dapat URL publik)
async function uploadToImgBB(buffer) {
  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);
  formData.append("image", buffer.toString("base64"));

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!json.success) throw new Error("Gagal upload ke Server");
  return json.data.url;
}

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const isIndo = lang === "id";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
      return ctx.reply(
        isIndo
          ? "📸 Balas gambar dengan /toanime untuk mengubahnya ke gaya anime."
          : "📸 Reply to an image with /toanime to convert it to anime style.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const loading = await ctx.reply(
      isIndo ? "🚀 Mengunggah dan mengonversi gambar..." : "🚀 Uploading and converting image..."
    );

    // Ambil file dari Telegram
    const photo = ctx.message.reply_to_message.photo.pop();
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    const fileRes = await fetch(fileUrl);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    // Upload ke ImgBB → dapat URL publik
    const publicUrl = await uploadToImgBB(buffer);

    // Kirim ke API Nekolabs
    const apiUrl = `https://api.nekolabs.web.id/tools/convert/toanime?imageUrl=${encodeURIComponent(publicUrl)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success || !data?.result) {
      throw new Error("❌ Gagal mengubah gambar ke anime.");
    }

    // Unduh hasil dari "result"
    const animeRes = await fetch(data.result);
    const animeBuffer = Buffer.from(await animeRes.arrayBuffer());

    // Kirim hasil ke user
    await ctx.replyWithPhoto(
      { source: animeBuffer },
      {
        caption: isIndo
          ? "✅ *Berhasil diubah ke versi anime!*"
          : "✅ *Successfully converted to anime style!*",
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
      }
    );

    // Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // Hapus pesan loading
    ctx.deleteMessage(loading.message_id).catch(() => {});
  } catch (err) {
    console.error("❌ Error di /toanime:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat mengubah gambar 😥"
        : "❌ An error occurred while converting image 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
