const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // 🔒 Cek limit
    if (user.limit <= 0) {
      return ctx.reply(
        lang === "id"
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔎 Pastikan reply ke stiker
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.sticker) {
      return ctx.reply(
        lang === "id"
          ? "⚠️ Balas stiker dengan perintah `/toimage`."
          : "⚠️ Reply to a sticker using `/toimage`.",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Pesan loading
    await ctx.reply(
      lang === "id"
        ? "🖼️ Sedang mengubah stiker menjadi gambar..."
        : "🖼️ Converting sticker to image...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 Ambil file stiker dari Telegram
    const fileId = reply.sticker.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // 💾 Simpan sementara
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
    const outputPath = path.join(tempDir, `image_${Date.now()}.png`);

    // 🔽 Unduh stiker
    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    // 🧠 Konversi tergantung tipe stiker
    if (reply.sticker.is_video || reply.sticker.is_animated) {
      // 🎞️ Jika stiker video/animasi (.webm), ambil frame pertama
      await new Promise((resolve, reject) => {
        const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vframes 1 "${outputPath}"`;
        exec(ffmpegCmd, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } else {
      // 🖼️ Jika stiker statis (.webp)
      const sharp = require("sharp");
      await sharp(inputPath).png().toFile(outputPath);
    }

    // 📤 Kirim hasil sebagai foto
    await ctx.replyWithPhoto(
      { source: outputPath },
      {
        caption:
          lang === "id"
            ? "✅ Stiker berhasil diubah menjadi gambar!"
            : "✅ Sticker successfully converted to image!",
        reply_to_message_id: ctx.message?.message_id,
      }
    );

    // 💰 Kurangi limit dan hapus file sementara
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

  } catch (err) {
    console.error("❌ Error di toImage:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat mengubah stiker menjadi gambar 😥"
        : "❌ An error occurred while converting sticker to image 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
