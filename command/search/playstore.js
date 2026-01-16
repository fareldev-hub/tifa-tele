const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    // Load user & limit
    const user = loadUser(ctx.from.id) || { limit: 5 };
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const query = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!query) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /playstore <nama_aplikasi>"
          : "💡 Use format: /playstore <app_name>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mencari aplikasi di Play Store..." : "⏳ Searching Play Store app...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // Panggil API Play Store
    const apiUrl = `https://api.siputzx.my.id/api/apk/playstore?query=${encodeURIComponent(query)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !Array.isArray(data?.data) || data.data.length === 0) {
      throw new Error("Aplikasi tidak ditemukan");
    }

    // Ambil 30 hasil
    const apps = data.data.slice(0, 30);

    // Buat teks hasil
    let message = apps.map((app, index) => {
      return `${index + 1}. *${app.nama}*\n👤 Developer: [${app.developer}](${app.link_dev})\n⭐ Rating: ${app.rate2 || "N/A"}\n🔗 [Play Store Link](${app.link})`;
    }).join("\n\n");

    await ctx.replyWithMarkdown(message, { reply_to_message_id: ctx.message?.message_id });

    try { await ctx.deleteMessage(waitMsg.message_id); } catch {}

  } catch (err) {
    console.error("⚠️ Error utama:", err.message);
    ctx.reply(
      (ctx.from.language_code || "en").startsWith("id")
        ? "⚠️ Gagal mencari aplikasi di Play Store. Coba lagi nanti."
        : "⚠️ Failed to search Play Store app. Please try again later.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
