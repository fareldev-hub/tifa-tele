const MAX_LENGTH = 3900;
const { bot_name, owner_id, owner_name } = require("../../settings");

module.exports = async (ctx) => {
  try {
    const start = Date.now();
    const targetId = owner_id;

    const text = ctx.message.text.split(" ").slice(1).join(" ").trim();
    const sender = ctx.from;
    const fullName = [sender.first_name, sender.last_name].filter(Boolean).join(" ");
    const username = sender.username ? `@${sender.username}` : "❌ Tidak ada username";
    const userId = sender.id;

    const replyMsg = ctx.message.reply_to_message;
    const safeText = text.length > MAX_LENGTH ? text.substring(0, MAX_LENGTH) + "..." : text;

    // Header identitas pengirim
    const header =
`📩 *Feedback Baru Diterima!*
👤 *Nama:* ${fullName}
🏷️ *Username:* ${username}
🆔 *ID:* \`${userId}\``;

    // Jika tidak ada teks dan tidak ada media
    if (!text && !replyMsg) {
      return ctx.reply(
        "Id : \n⚠️ Gunakan format:\n/feedback <pesan>\nAtau reply ke gambar/video dengan /feedback <pesan tambahan>\n\nEn:\nUse the format:\n/feedback <message> \nOr reply to the image/video with /feedback <message> ",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    if (replyMsg) {
      const mediaCaption = replyMsg.caption || "";
      const media =
        replyMsg.photo?.slice(-1)[0]
          ? { type: "photo", file_id: replyMsg.photo.slice(-1)[0].file_id }
          : replyMsg.video
          ? { type: "video", file_id: replyMsg.video.file_id }
          : replyMsg.document
          ? { type: "document", file_id: replyMsg.document.file_id }
          : replyMsg.audio
          ? { type: "audio", file_id: replyMsg.audio.file_id }
          : replyMsg.sticker
          ? { type: "sticker", file_id: replyMsg.sticker.file_id }
          : null;

      // Jika media valid
      if (media) {
        // Gabungkan feedback + caption asli media
        const captionCombined = 
`${header}

💬 *Feedback:*
${safeText || "(Tidak ada pesan)"}

📝 *Caption Asli:*
${mediaCaption || "(Tanpa caption)"}`;

        switch (media.type) {
          case "photo":
            await ctx.telegram.sendPhoto(targetId, media.file_id, {
              caption: captionCombined,
              parse_mode: "Markdown",
            });
            break;
          case "video":
            await ctx.telegram.sendVideo(targetId, media.file_id, {
              caption: captionCombined,
              parse_mode: "Markdown",
            });
            break;
          case "document":
            await ctx.telegram.sendDocument(targetId, media.file_id, {
              caption: captionCombined,
              parse_mode: "Markdown",
            });
            break;
          case "audio":
            await ctx.telegram.sendAudio(targetId, media.file_id, {
              caption: captionCombined,
              parse_mode: "Markdown",
            });
            break;
          case "sticker":
            await ctx.telegram.sendMessage(targetId, captionCombined, { parse_mode: "Markdown" });
            await ctx.telegram.sendSticker(targetId, media.file_id);
            break;
          default:
            await ctx.telegram.sendMessage(targetId, `${header}\n\n⚠️ Jenis media tidak didukung.`, { parse_mode: "Markdown" });
        }
      } else {
        // Jika reply tapi bukan media
        await ctx.telegram.sendMessage(targetId, 
`${header}

💬 *Feedback:*
${safeText}

💭 *Pesan yang direply:*
${replyMsg.text || "(Kosong)"}`, 
        { parse_mode: "Markdown" });
      }

    } else {
      // === Jika hanya teks (tanpa reply media) ===
      const messageToSend = 
`${header}

💬 *Feedback:*
${safeText}`;
      await ctx.telegram.sendMessage(targetId, messageToSend, { parse_mode: "Markdown" });
    }

    // Hitung durasi pengiriman
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    await ctx.reply(
      `✅ Feedback berhasil dikirim!\n🕒 Waktu pengiriman: ${duration} detik`,
      { reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Gagal kirim feedback:", err);
    ctx.reply(`❌ Terjadi kesalahan: ${err.message}`, {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
