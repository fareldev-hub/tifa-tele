const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0) {
      const msg =
        lang === "id"
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }
    
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /gbrat <teks>\nContoh: `/gbrat Hai Cantik!`"
          : "💡 Use format: /gbrat <text>\nExample: `/gbrat Hello Girl!`",
        { reply_to_message_id: ctx.message?.message_id, parse_mode: "Markdown" }
      );
    }

    // Pesan loading
    await ctx.reply(
      lang === "id" ? "🎨 Sedang membuat stiker cewek brat..." : "🎨 Generating girl brat sticker...",
      { reply_to_message_id: ctx.message?.message_id }
    );
    
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // Ambil gambar dari API Deline
    const apiUrl = `https://api.deline.web.id/maker/cewekbrat?text=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image")) {
      throw new Error("API tidak mengembalikan gambar yang valid.");
    }

    // Buffer gambar
    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // Kirim sebagai stiker (reply ke pesan pengguna)
    await ctx.replyWithSticker(
      { source: imageBuffer },
      { reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di gbrat.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat stiker"
        : "❌ An error occurred while generating the sticker",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
