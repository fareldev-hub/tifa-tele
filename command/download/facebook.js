const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { downloadWithProgress } = require("../../lib/loading"); // gunakan helper progress

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    // 🔹 Load user data
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
          ? "💡 Gunakan format: /facebook <video_url>\nContoh: /facebook https://fb.watch/xxxx/"
          : "💡 Use format: /facebook <video_url>\nExample: /facebook https://fb.watch/xxxx/",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Kirim pesan awal
    const mainMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil video Facebook..." : "⏳ Fetching Facebook video...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔹 Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 🔹 Ambil data dari API
    const apiUrl = `https://api.deline.web.id/downloader/facebook?url=${encodeURIComponent(input)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !data?.result) {
      console.log("Facebook API response:", data);
      throw new Error("Video Facebook tidak tersedia untuk diunduh.");
    }

    // 🔹 Ambil file info
    let downloadUrl, fileName, mimetype;
    if (data.result.list && data.result.list.length > 0) {
      downloadUrl = data.result.list[0].url;
      fileName = data.result.list[0].fileName || "facebook_video.mp4";
      mimetype = data.result.list[0].mimetype || "video/mp4";
    } else if (data.result.download) {
      downloadUrl = data.result.download;
      fileName = data.result.download.split("/").pop() || "facebook_file";
      mimetype = data.result.mimetype || "video/mp4";
    } else {
      throw new Error("Tidak ada file yang bisa diunduh dari Facebook.");
    }

    // 🔹 Update pesan → mulai unduh
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      mainMsg.message_id,
      undefined,
      isIndo
        ? "📥 Mengunduh video dari Facebook..."
        : "📥 Downloading video from Facebook..."
    );

    // 🔹 Unduh file dengan progress bar (edit message realtime)
    const fileBuffer = await downloadWithProgress(
      ctx,
      mainMsg,
      downloadUrl,
      isIndo
        ? "📥 Mengunduh video dari Facebook..."
        : "📥 Downloading video from Facebook..."
    );

    // 🔹 Kirim hasil file
    const fileOptions = { reply_to_message_id: ctx.message?.message_id };

    if (mimetype.startsWith("video")) {
      await ctx.replyWithVideo(
        { source: fileBuffer, filename: fileName },
        fileOptions
      );
    } else if (mimetype.startsWith("image")) {
      await ctx.replyWithPhoto(
        { source: fileBuffer, filename: fileName },
        fileOptions
      );
    } else {
      await ctx.replyWithDocument(
        { source: fileBuffer, filename: fileName },
        fileOptions
      );
    }

    // 🔹 Update pesan terakhir menjadi sukses
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      mainMsg.message_id,
      undefined,
      isIndo
        ? `✅ Video berhasil dikirim!\n💎 Sisa limit: ${user.limit}`
        : `✅ Video sent successfully!\n💎 Remaining limit: ${user.limit}`
    );

  } catch (err) {
    console.error("⚠️ Error utama:", err);

    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message?.message_id,
        undefined,
        (ctx.from.language_code || "en").startsWith("id")
          ? `⚠️ Gagal memproses video Facebook.\n🧩 Error: ${err.message}`
          : `⚠️ Failed to process Facebook video.\n🧩 Error: ${err.message}`
      );
    } catch {
      await ctx.reply(
        (ctx.from.language_code || "en").startsWith("id")
          ? `⚠️ Gagal memproses video Facebook.\n🧩 Error: ${err.message}`
          : `⚠️ Failed to process Facebook video.\n🧩 Error: ${err.message}`,
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  }
};
