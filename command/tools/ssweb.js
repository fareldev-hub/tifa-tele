const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // cek limit
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your limit has run out. Wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const args = ctx.message.text.split(" ").slice(1);
    const url = args[0];
    let device = args[1] || "desktop"; // default desktop

    if (!url) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format:\n/ssweb <url> [device]\nContoh: /ssweb https://example.com mobile"
          : "💡 Use format:\n/ssweb <url> [device]\nExample: /ssweb https://example.com mobile",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    device = device.toLowerCase();
    if (!["mobile", "desktop", "tablet"].includes(device)) device = "desktop";

    user.limit -= 1;
    saveUser(ctx.from.id, user);

    await ctx.reply(
      isIndo
        ? `⏳ Membuat screenshot website (${device})...`
        : `⏳ Generating website screenshot (${device})...`,
      { reply_to_message_id: ctx.message?.message_id }
    );

    try {
      const apiUrl = `https://api.nekolabs.web.id/tools/ssweb?url=${encodeURIComponent(url)}&device=${device}`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("API ssweb gagal");

      const json = await res.json();
      if (!json.success || !json.result) throw new Error("Response API tidak valid");

      await ctx.replyWithPhoto(
        { url: json.result },
        {
          caption: isIndo
            ? `✨ *Screenshot berhasil dibuat!*\n\n🌐 URL: ${url}\n📱 Device: ${device}`
            : `✨ *Screenshot successfully generated!*\n\n🌐 URL: ${url}\n📱 Device: ${device}`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    } catch (err) {
      console.error("⚠️ ssweb API Error:", err.message);
    }

    // fallback: Unsplash
    try {
      const unsplashUrl = `https://source.unsplash.com/1024x1024/?website`;
      await ctx.replyWithPhoto(
        { url: unsplashUrl },
        {
          caption: isIndo
            ? `✨ *Screenshot fallback (Unsplash)*\n🌐 URL: ${url}\n📱 Device: ${device}\n💎 Sisa Limit: ${user.limit}`
            : `✨ *Fallback screenshot (Unsplash)*\n🌐 URL: ${url}\n📱 Device: ${device}\n💎 Remaining Limit: ${user.limit}`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    } catch (err) {
      console.error("⚠️ Unsplash Error:", err.message);
      const picsumUrl = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000000)}`;
      await ctx.replyWithPhoto(
        { url: picsumUrl },
        {
          caption: isIndo
            ? `✨ *Screenshot fallback (Picsum)*\n🌐 URL: ${url}\n📱 Device: ${device}\n💎 Sisa Limit: ${user.limit}`
            : `✨ *Fallback screenshot (Picsum)*\n🌐 URL: ${url}\n📱 Device: ${device}\n💎 Remaining Limit: ${user.limit}`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    }
  } catch (err) {
    console.error("❌ Error di /ssweb:", err);
    ctx.reply(
      isIndo
        ? "❌ Terjadi kesalahan saat memproses /ssweb 😥"
        : "❌ An error occurred while processing /ssweb 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
