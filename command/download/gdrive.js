const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { downloadWithProgress } = require("../../lib/loading");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    // 🔹 Load user & cek limit
    const user = loadUser(ctx.from.id) || { limit: 5 };
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Ambil input URL
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /gdrive <file_url>\nContoh: /gdrive https://drive.google.com/file/d/xxxx/view"
          : "💡 Use format: /gdrive <file_url>\nExample: /gdrive https://drive.google.com/file/d/xxxx/view",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Ambil File ID dari URL
    const fileIdMatch = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      return ctx.reply(
        isIndo
          ? "❌ URL Google Drive tidak valid."
          : "❌ Invalid Google Drive URL.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const fileId = fileIdMatch[1];
    const apiUrl = `https://api.siputzx.my.id/api/d/gdrive?url=${encodeURIComponent(`https://drive.google.com/file/d/${fileId}/view`)}`;

    // 🔹 Pesan awal
    const mainMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil data Google Drive..." : "⏳ Fetching Google Drive file...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔹 Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 🔹 Ambil info file dari API
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !data?.data || !data.data.download) {
      throw new Error("File Google Drive tidak tersedia untuk diunduh");
    }

    const downloadUrl = data.data.download;
    const fileName = data.data.name || "file";

    // 🔹 Update pesan → mulai unduh
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      mainMsg.message_id,
      undefined,
      isIndo ? "📥 Mengunduh file dari Google Drive..." : "📥 Downloading file from Google Drive..."
    );

    // 🔹 Unduh dengan progress bar realtime
    const fileBuffer = await downloadWithProgress(
      ctx,
      mainMsg,
      downloadUrl,
      isIndo ? "📥 Mengunduh file dari Google Drive..." : "📥 Downloading file from Google Drive..."
    );

    // 🔹 Kirim file hasil unduhan
    await ctx.replyWithDocument(
      { source: fileBuffer, filename: fileName },
      {
        caption: `✅ ${
          isIndo ? "Selesai! File berhasil diunduh." : "Done! File downloaded successfully."
        }`,
        reply_to_message_id: ctx.message?.message_id,
      }
    );

    // 🔹 Edit pesan akhir jadi sukses
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      mainMsg.message_id,
      undefined,
      isIndo
        ? "✅ File berhasil dikirim!"
        : "✅ File sent successfully!"
    );
  } catch (err) {
    console.error("⚠️ Error utama:", err);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message?.message_id,
        undefined,
        (ctx.from.language_code || "en").startsWith("id")
          ? "⚠️ Gagal memproses file Google Drive. Coba lagi nanti."
          : "⚠️ Failed to process Google Drive file. Please try again later."
      );
    } catch {
      await ctx.reply(
        (ctx.from.language_code || "en").startsWith("id")
          ? "⚠️ Gagal memproses file Google Drive. Coba lagi nanti."
          : "⚠️ Failed to process Google Drive file. Please try again later.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  }
};
