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
      return ctx.reply(
        lang === "id"
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 📩 Ambil teks dari perintah
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    if (!input.includes("|")) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /smeme <teks_atas> | <teks_bawah>\nContoh: `/smeme when | yah`"
          : "💡 Use format: /smeme <top_text> | <bottom_text>\nExample: `/smeme when | oh no`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    const [topText, bottomText] = input.split("|").map((t) => t.trim());

    // 🖼️ Pastikan reply ke gambar
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.photo) {
      return ctx.reply(
        lang === "id"
          ? "⚠️ Balas gambar dengan perintah `/smeme <teks1> | <teks2>`."
          : "⚠️ Reply to an image using `/smeme <text1> | <text2>`.",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Pesan loading
    await ctx.reply(
      lang === "id" ? "🖼️ Sedang membuat stiker meme..." : "🖼️ Generating meme sticker...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 Ambil link file gambar Telegram
    const fileId = reply.photo[reply.photo.length - 1].file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const imageUrl = encodeURIComponent(fileLink.href);

    // 🔗 API URL
    const apiUrl = `https://api.deline.web.id/maker/smeme?image=${imageUrl}&top=${encodeURIComponent(
      topText
    )}&bottom=${encodeURIComponent(bottomText)}`;

    // 🌐 Ambil hasil dari API
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image"))
      throw new Error("API tidak mengembalikan gambar yang valid.");

    const buffer = Buffer.from(await res.arrayBuffer());

    // 💾 Simpan sementara
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `smeme_${Date.now()}.png`);
    fs.writeFileSync(filePath, buffer);

    // 🎭 Kirim sebagai stiker
    await ctx.replyWithSticker(
      { source: filePath },
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 💰 Kurangi limit dan hapus file sementara
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    fs.unlinkSync(filePath);

    // ✅ Pesan sukses
    await ctx.reply(
      lang === "id"
        ? "✅ Stiker meme berhasil dibuat!"
        : "✅ Meme sticker created successfully!",
      { reply_to_message_id: ctx.message?.message_id }
    );
  } catch (err) {
    console.error("❌ Error di smeme.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat stiker meme 😥"
        : "❌ An error occurred while generating meme sticker 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
