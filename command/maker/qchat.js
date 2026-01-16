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
          ? "💬 Gunakan format: /qchat <teks>\nContoh: `/qchat Halo semua!`"
          : "💬 Use format: /qchat <text>\nExample: `/qchat Hello everyone!`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Pesan loading
    await ctx.reply(
      lang === "id"
        ? "🖼️ Sedang membuat stiker chat..."
        : "🖼️ Generating chat sticker...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🧩 Ambil nama dan avatar pengguna
    const nama = ctx.from.first_name || "Anonim";
    let avatarUrl =
      "https://telegra.ph/file/3b181a5b3b73350e9f85e.png"; // default avatar

    try {
      const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, { limit: 1 });
      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);
        avatarUrl = fileLink.href;
      }
    } catch (e) {
      console.warn("⚠️ Gagal ambil foto profil, gunakan default.");
    }

    // 🔗 Buat URL API Deline
    const color = "white";
    const apiUrl = `https://api.deline.web.id/maker/qc?text=${encodeURIComponent(
      text
    )}&color=${color}&avatar=${encodeURIComponent(avatarUrl)}&nama=${encodeURIComponent(
      nama
    )}`;

    // 🌐 Ambil gambar dari API
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image"))
      throw new Error("API tidak mengembalikan gambar valid.");

    const buffer = Buffer.from(await res.arrayBuffer());

    // 💾 Simpan sementara
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `qchat_${Date.now()}.png`);
    fs.writeFileSync(filePath, buffer);

    // 🎭 Kirim hasil sebagai stiker
    await ctx.replyWithSticker(
      { source: filePath },
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 💰 Kurangi limit + hapus file
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    fs.unlinkSync(filePath);

    // ✅ Notifikasi sukses
    await ctx.reply(
      lang === "id"
        ? "✅ Stiker chat berhasil dibuat!"
        : "✅ Chat sticker successfully created!",
      { reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di qchat.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat stiker chat 😥"
        : "❌ An error occurred while generating chat sticker 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
