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

    // 🔹 Ambil input repo
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /github <repo_url>\nContoh: /github https://github.com/user/repo"
          : "💡 Use format: /github <repo_url>\nExample: /github https://github.com/user/repo",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Pesan awal (akan di-edit terus)
    const mainMsg = await ctx.reply(
      isIndo
        ? "⏳ Mengambil data GitHub repository..."
        : "⏳ Fetching GitHub repository...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔹 Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 🔹 Ambil data API
    const apiUrl = `https://api.siputzx.my.id/api/d/github?url=${encodeURIComponent(input)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !data?.data || !data.data.download_url) {
      throw new Error("File repository tidak tersedia untuk diunduh");
    }

    const downloadUrl = data.data.download_url;
    const repoName = data.data.repo || "repository";

    // 🔹 Update pesan menjadi status download
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      mainMsg.message_id,
      undefined,
      isIndo ? "📥 Mengunduh file repository..." : "📥 Downloading repository file..."
    );

    // 🔹 Unduh file ZIP dengan progress bar
    const zipBuffer = await downloadWithProgress(
      ctx,
      mainMsg,
      downloadUrl,
      isIndo ? "📥 Mengunduh file repository..." : "📥 Downloading repository file..."
    );

    // 🔹 Kirim file hasil download
    await ctx.replyWithDocument(
      { source: zipBuffer, filename: `${repoName}.zip` },
      {
        caption: `✅ ${
          isIndo ? "Selesai! Repository berhasil diunduh." : "Done! Repository downloaded successfully."
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
        ? "✅ Repository berhasil dikirim!"
        : "✅ Repository sent successfully!"
    );
  } catch (err) {
    console.error("⚠️ Error utama:", err);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message?.message_id,
        undefined,
        (ctx.from.language_code || "en").startsWith("id")
          ? "⚠️ Gagal memproses GitHub repository. Coba lagi nanti."
          : "⚠️ Failed to process GitHub repository. Please try again later."
      );
    } catch {
      await ctx.reply(
        (ctx.from.language_code || "en").startsWith("id")
          ? "⚠️ Gagal memproses GitHub repository. Coba lagi nanti."
          : "⚠️ Failed to process GitHub repository. Please try again later.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  }
};
