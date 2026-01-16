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

    // 🧠 Ambil teks dari perintah
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /bratv <teks>\nContoh: `/bratv Halo bwang!`"
          : "💡 Use format: /bratv <text>\nExample: `/bratv Hello bro!`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Kirim pesan loading
    await ctx.reply(
      lang === "id" ? "🎬 Sedang membuat video brat..." : "🎬 Generating brat video...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 Ambil video dari API Yupra
    const apiUrl = `https://api.yupra.my.id/api/video/bratv?text=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("video")) {
      throw new Error("API tidak mengembalikan video yang valid.");
    }

    // 🧩 Ambil buffer video
    const buffer = Buffer.from(await res.arrayBuffer());

    // 💾 Simpan sementara
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const videoPath = path.join(tempDir, `bratv_${Date.now()}.webm`);
    fs.writeFileSync(videoPath, buffer);

    // 🎭 Kirim sebagai stiker video
    await ctx.replyWithSticker(
      { source: videoPath },
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 💰 Kurangi limit + hapus file sementara
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    fs.unlinkSync(videoPath);

    // ✅ Notifikasi sukses
    await ctx.reply(
      lang === "id"
        ? "✅ Video brat berhasil dijadikan stiker!"
        : "✅ Brat video successfully converted to sticker!",
      { reply_to_message_id: ctx.message?.message_id }
    );
  } catch (err) {
    console.error("❌ Error di bratv.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat video brat 😥"
        : "❌ An error occurred while generating brat video 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
