const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // 🔒 Cek limit
    if (user.limit <= 0) {
      const msg =
        lang === "id"
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }

    // 🧠 Ambil teks
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /brat <teks>\nContoh: `/brat Halo Dunia!`"
          : "💡 Use format: /brat <text>\nExample: `/brat Hello World!`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Pesan loading
    await ctx.reply(
      lang === "id" ? "🎨 Sedang membuat stiker brat..." : "🎨 Generating brat sticker...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 Ambil gambar dari API Deline CewekBrat
    const apiUrl = `https://api.deline.web.id/maker/cewekbrat?text=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image"))
      throw new Error("API tidak mengembalikan gambar valid.");

    const buffer = Buffer.from(await res.arrayBuffer());

    // 💾 Simpan sementara
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, "brat.png");
    fs.writeFileSync(filePath, buffer);

    // 🎭 Kirim sebagai stiker (balas pesan pengguna)
    await ctx.replyWithSticker(
      { source: filePath },
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 💰 Kurangi limit + hapus file
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("❌ Error di brat.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat stiker 😥"
        : "❌ An error occurred while generating the sticker 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
