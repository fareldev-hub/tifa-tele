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

    // Ambil input teks setelah /iqc
    const text = ctx.message.text.replace(/^\/\w+\s*/, "").trim();

    if (!text) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /iqc <teks>\nContoh: `/iqc Halo dunia`"
          : "💡 Use format: /iqc <text>\nExample: `/iqc Hello world`",
        { reply_to_message_id: ctx.message?.message_id, parse_mode: "Markdown" }
      );
    }

    // ⏳ Kirim pesan loading
    await ctx.reply(
      lang === "id"
        ? "🕐 Sedang membuat template IQC..."
        : "🕐 Generating IQC template...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 🔹 Waktu otomatis berdasarkan sistem
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const chatTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const statusBarTime = `${pad(now.getHours())}:${pad(now.getMinutes() + 1)}`; // misal +1 menit

    // 🔗 API Deline — hasil langsung berupa gambar
    const apiUrl = `https://api.deline.web.id/maker/iqc?text=${encodeURIComponent(
      text
    )}&chatTime=${encodeURIComponent(chatTime)}&statusBarTime=${encodeURIComponent(
      statusBarTime
    )}`;

    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image")) {
      throw new Error("API tidak mengembalikan gambar yang valid.");
    }

    // Ambil buffer gambar
    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // Kirim gambar hasilnya
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption: lang === "id" ? "✅ *Selesai membuat!*" : "✅ *Finished generating!*",
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ Error di iqc.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat gambar 😥"
        : "❌ An error occurred while generating the image 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
