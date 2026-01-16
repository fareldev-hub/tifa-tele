const fetch = require("node-fetch");
const axios = require("axios"); // Add missing import
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Maaf, limit kamu sudah habis. Tunggu 24 jam untuk reset limit."
          : "🚫 Sorry, your limit has run out. Please wait 24 hours for it to reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const input = ctx.message.text.split(" ").slice(1).join(" ");
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan perintah: /pinterest <deskripsi gambar>\nContoh: /pinterest pemandangan bulan di malam hari"
          : "💡 Use the command: /pinterest <image description>\nExample: /pinterest landscape of the moon at night",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    await ctx.reply(
      isIndo
        ? "⏳ Sedang mencari gambar di Pinterest, mohon tunggu sebentar..."
        : "⏳ Searching for images on Pinterest, please wait..."
    );

    const pintapi = `https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(input)}&type=image`;
    const res = await fetch(pintapi);

    if (!res.ok) throw new Error("Pinterest API failed");

    const data = await res.json();
    if (!data || !data.data || data.data.length === 0) {
      return ctx.reply(
        isIndo
          ? "⚠️ Gambar tidak ditemukan di Pinterest. Coba gunakan kata kunci lain."
          : "⚠️ No image found on Pinterest. Try using a different keyword.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Ambil gambar pertama
    const imageUrl = data.data[0].image_url || data.data[0].pin;
    if (!imageUrl) throw new Error("Image URL not found");

    // Download buffer gambar
    const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imageRes.data, "binary");

    // Kurangi limit setelah berhasil fetch
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: isIndo
          ? `✨ Gambar berhasil ditemukan!\n\n📝 Prompt: ${input}\n📌 Sumber: Pinterest`
          : `✨ Image found!\n\n📝 Prompt: ${input}\n📌 Source: Pinterest`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ Error di /pinterest:", err);
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");
    ctx.reply(
      isIndo
        ? "🚫 Gagal mengambil gambar dari Pinterest. Coba gunakan kata kunci lain."
        : "🚫 Failed to fetch image from Pinterest. Try using a different keyword.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
