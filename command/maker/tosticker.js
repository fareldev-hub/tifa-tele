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

    const reply = ctx.message.reply_to_message;
    if (!reply || (!reply.photo && !reply.video)) {
      return ctx.reply(
        lang === "id"
          ? "⚠️ Balas *gambar atau video (maks 10 detik)* dengan perintah `/tosticker`."
          : "⚠️ Reply to an *image or video (max 10 seconds)* using `/tosticker`.",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Pesan loading
    await ctx.reply(
      lang === "id"
        ? "🎨 Sedang mengubah menjadi stiker..."
        : "🎨 Converting to sticker...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔽 Ambil file dari Telegram
    let fileId, fileLink;
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // ========== HANDLE GAMBAR ==========
    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
      fileLink = await ctx.telegram.getFileLink(fileId);

      const res = await fetch(fileLink.href);
      const buffer = Buffer.from(await res.arrayBuffer());
      const inputPath = path.join(tempDir, `input_${Date.now()}.jpg`);
      const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
      fs.writeFileSync(inputPath, buffer);

      // Konversi gambar → WEBP
      const sharp = require("sharp");
      await sharp(inputPath)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ lossless: true })
        .toFile(outputPath);

      await ctx.replyWithSticker({ source: outputPath }, { reply_to_message_id: ctx.message?.message_id });

      // Hapus file & kurangi limit
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    }

    // ========== HANDLE VIDEO ==========
    else if (reply.video) {
      const duration = reply.video.duration || 0;
      if (duration > 10) {
        return ctx.reply(
          lang === "id"
            ? "⚠️ Durasi video terlalu panjang. Maksimal 10 detik untuk dijadikan stiker."
            : "⚠️ Video duration too long. Maximum is 10 seconds to create a sticker.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }

      fileId = reply.video.file_id;
      fileLink = await ctx.telegram.getFileLink(fileId);

      const res = await fetch(fileLink.href);
      const buffer = Buffer.from(await res.arrayBuffer());
      const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
      const outputPath = path.join(tempDir, `sticker_${Date.now()}.webm`);
      fs.writeFileSync(inputPath, buffer);

      // 🎞️ Konversi ke WEBM (format video sticker Telegram)
      await new Promise((resolve, reject) => {
        const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=30" -an -c:v libvpx-vp9 -b:v 500k -t 10 -pix_fmt yuva420p "${outputPath}"`;
        exec(ffmpegCmd, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Kirim hasil sebagai stiker video
      await ctx.replyWithSticker({ source: outputPath }, { reply_to_message_id: ctx.message?.message_id });

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    }

    // 💰 Kurangi limit & simpan
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    await ctx.reply(
      lang === "id"
        ? "✅ Berhasil dijadikan stiker!"
        : "✅ Successfully converted to sticker!",
      { reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di toSticker:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat stiker 😥"
        : "❌ An error occurred while converting to sticker 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
