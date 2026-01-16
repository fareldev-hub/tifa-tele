const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { downloadWithProgress } = require("../../lib/loading");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    // === Load user & cek limit ===
    const user = loadUser(ctx.from.id) || { limit: 5 };
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Ambil input URL ===
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /download <file_url>"
          : "💡 Use format: /download <file_url>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Pesan loading ===
    const processMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil data file..." : "⏳ Fetching file...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    let apiUrl, fileName, downloadUrl;

    // === Deteksi jenis URL ===
    if (input.includes("drive.google.com")) {
      const fileIdMatch = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!fileIdMatch) throw new Error("URL Google Drive tidak valid.");
      const fileId = fileIdMatch[1];
      apiUrl = `https://api.siputzx.my.id/api/d/gdrive?url=${encodeURIComponent(`https://drive.google.com/file/d/${fileId}/view`)}`;

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data?.status || !data?.data?.download) {
        console.log("Google Drive API response:", data);
        throw new Error("File Google Drive tidak tersedia untuk diunduh");
      }

      downloadUrl = data.data.download;
      fileName = data.data.name || "file";
    } else if (input.includes("mediafire.com")) {
      apiUrl = `https://api.deline.web.id/downloader/mediafire?url=${encodeURIComponent(input)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data?.status || !data?.result?.downloadUrl) {
        console.log("MediaFire API response:", data);
        throw new Error("File MediaFire tidak tersedia untuk diunduh");
      }

      downloadUrl = data.result.downloadUrl;
      fileName = data.result.fileName || "file";
    } else if (input.includes("sfile.mobi")) {
      apiUrl = `https://api.deline.web.id/downloader/sfile?url=${encodeURIComponent(input)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data?.status || !data?.download) {
        console.log("Sfile API response:", data);
        throw new Error("File Sfile tidak tersedia untuk diunduh");
      }

      downloadUrl = data.download;
      fileName = data.metadata?.file_name || "file";
    } else {
      throw new Error("URL tidak dikenali (hanya mendukung Google Drive / MediaFire / Sfile)");
    }

    // === Kurangi limit user ===
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // === Unduh file dengan progress bar ===
    const fileBuffer = await downloadWithProgress(
      ctx,
      processMsg,
      downloadUrl,
      isIndo
        ? "📥 Mengunduh file dari server..."
        : "📥 Downloading file from server...",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    // === Kirim hasilnya ke user ===
    await ctx.replyWithDocument(
      { source: Buffer.from(fileBuffer), filename: fileName },
      { reply_to_message_id: ctx.message?.message_id }
    );

    // === Hapus pesan loading ===
    await ctx.telegram.deleteMessage(ctx.chat.id, processMsg.message_id).catch(() => {});

  } catch (err) {
    console.error("⚠️ Error utama:", err);

    // Hapus pesan loading kalau masih ada
    if (ctx.chat && err?.message_id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, err.message_id).catch(() => {});
    }

    await ctx.reply(
      (ctx.from.language_code || "en").startsWith("id")
        ? `⚠️ Gagal memproses file. ${err.message}`
        : `⚠️ Failed to process file. ${err.message}`,
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
