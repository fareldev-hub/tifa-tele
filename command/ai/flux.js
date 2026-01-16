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

    const input = ctx.message.text.split(" ").slice(1).join(" ");
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /flux <deskripsi gambar>\nContoh: /flux pemandangan bulan di malam hari"
          : "💡 Use format: /flux <image description>\nExample: /flux landscape of the moon at night",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // kurangi limit
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    await ctx.reply(
      isIndo
        ? "⏳ Membuat gambar, mohon tunggu sebentar..."
        : "⏳ Generating image, please wait..."
    );

    // === Pollinations / Animagine API ===
    try {
      const apiUrl = `https://api.nekolabs.web.id/ai/flux/pro?prompt=${encodeURIComponent(input)}&ratio=1:1`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Pollinations API failed");

      const json = await res.json();
      if (!json.success || !json.result) throw new Error("Invalid API response");

      await ctx.replyWithPhoto(
        { url: json.result },
        {
          caption: isIndo
            ? `✨ *Gambar berhasil dibuat!*\n\n📝 *Prompt:* ${input}\n🤖 *Dibuat oleh Vionix AI*`
            : `✨ *Image successfully generated!*\n\n📝 *Prompt:* ${input}\n🤖 *Powered by Vionix AI*`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    } catch (err) {
      console.error("⚠️ Pollinations Error:", err.message);
    }

    // === Fallback Unsplash ===
    try {
      const unsplashUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(input)}`;
      await ctx.replyWithPhoto(
        { url: unsplashUrl },
        {
          caption: isIndo
            ? `✨ *Gambar berhasil dibuat!*\n\n📝 *Prompt:* ${input}\n🌄 *Sumber:* Unsplash\n💎 *Sisa Limit:* ${user.limit}/10`
            : `✨ *Image successfully generated!*\n\n📝 *Prompt:* ${input}\n🌄 *Source:* Unsplash\n💎 *Remaining Limit:* ${user.limit}/10`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    } catch (err) {
      console.error("⚠️ Unsplash Error:", err.message);
    }

    // === Fallback Picsum ===
    try {
      const picsumUrl = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000000)}`;
      await ctx.replyWithPhoto(
        { url: picsumUrl },
        {
          caption: isIndo
            ? `✨ *Gambar acak berhasil dibuat!*\n\n📝 *Prompt:* ${input}\n🖼️ *Sumber:* Picsum\n💎 *Sisa Limit:* ${user.limit}/10`
            : `✨ *Random image generated!*\n\n📝 *Prompt:* ${input}\n🖼️ *Source:* Picsum\n💎 *Remaining Limit:* ${user.limit}/10`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    } catch (err) {
      console.error("❌ Picsum Error:", err.message);
      ctx.reply(
        isIndo
          ? "🚫 Gagal membuat gambar. Silakan coba lagi dengan prompt berbeda."
          : "🚫 Failed to generate image. Please try again with a different prompt.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  } catch (err) {
    console.error("❌ Error di /flux:", err);
    ctx.reply(
      isIndo
        ? "Terjadi kesalahan saat memproses /flux 😥"
        : "An error occurred while processing /flux 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
