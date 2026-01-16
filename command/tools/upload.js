const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");
const FormData = require("form-data");
const { loadUser, saveUser } = require("../../handler");

const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;

async function uploadToImageKit(filePath, fileName) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append("fileName", fileName);

  const headers = {
    Authorization:
      "Basic " +
      Buffer.from(IMAGEKIT_PRIVATE_KEY + ":").toString("base64"),
  };

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  const json = await res.json().catch(() => ({}));
  if (!json.url) throw new Error("Upload ke ImageKit gagal: " + JSON.stringify(json));
  return json.url;
}

// Escape teks agar aman di parse_mode: HTML
function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = async (ctx) => {
  if (ctx.state?.handledUpload) return;
  ctx.state.handledUpload = true;

  const isIndo = (ctx.from?.language_code || "").startsWith("id");
  const user = loadUser(ctx.from.id, ctx.from.first_name);

  try {
    // Cek kredensial ImageKit
    if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
      return ctx.reply(
        isIndo
          ? "⚠️ Konfigurasi ImageKit belum lengkap di environment!"
          : "⚠️ ImageKit configuration missing in environment!",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Cek limit user
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    let fileId, fileName;
    const messageText = ctx.message.text || "";
    const sourceMsg = ctx.message.reply_to_message || ctx.message;
    const userCaption = messageText.replace(/^\/upload\s*/i, "").trim();

    // Deteksi file / foto / video
    if (sourceMsg.photo) {
      const photo = sourceMsg.photo[sourceMsg.photo.length - 1];
      fileId = photo.file_id;
      fileName = "photo.jpg";
    } else if (sourceMsg.video) {
      fileId = sourceMsg.video.file_id;
      fileName = sourceMsg.video.file_name || "video.mp4";
    } else if (sourceMsg.document) {
      fileId = sourceMsg.document.file_id;
      fileName = sourceMsg.document.file_name || "file";
    } else {
      return ctx.reply(
        isIndo
          ? "⚠️ Kirim atau balas pesan berisi foto, video, atau file untuk diupload."
          : "⚠️ Send or reply to a message containing a photo, video, or file to upload.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const waitingMsg = await ctx.reply(
      isIndo
        ? "⏳ Mengunggah ke ImageKit, mohon tunggu..."
        : "⏳ Uploading to ImageKit, please wait...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Ambil file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(fileLink.href);
    const buffer = await res.buffer();

    // Simpan sementara
    const tempPath = path.join(__dirname, "..", "temp_" + fileName);
    fs.writeFileSync(tempPath, buffer);

    // Upload ke ImageKit
    const fileUrl = await uploadToImageKit(tempPath, fileName);

    // Hapus file sementara
    fs.unlinkSync(tempPath);

    // Kurangi limit user
    user.limit -= 5;
    saveUser(ctx.from.id, user);

    const safeCaption = escapeHTML(userCaption);
    const safeUrl = escapeHTML(fileUrl);

    // Format hasil upload
    let replyText = isIndo
      ? `✅ <b>File berhasil diupload ke ImageKit!</b>\n🔗 <a href="${safeUrl}">Klik di sini untuk membuka</a>`
      : `✅ <b>File successfully uploaded to ImageKit!</b>\n🔗 <a href="${safeUrl}">Click here to open</a>`;

    if (userCaption) {
      replyText += isIndo
        ? `\n📝 <b>Catatan:</b> ${safeCaption}`
        : `\n📝 <b>Caption:</b> ${safeCaption}`;
    }

    await ctx.reply(replyText, {
      parse_mode: "HTML",
      disable_web_page_preview: false,
      reply_to_message_id: ctx.message?.message_id,
    });

    ctx.deleteMessage(waitingMsg.message_id).catch(() => {});
  } catch (err) {
    console.error("❌ Error di /upload:", err);
    await ctx.reply(
      isIndo
        ? "❌ Gagal mengunggah file ke ImageKit. Coba lagi nanti."
        : "❌ Failed to upload file to ImageKit. Please try again later.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
