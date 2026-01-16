const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { bot_name } = require("../../settings");

module.exports = async (ctx) => {
  try {
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

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
          ? "💡 Gunakan format: /imagen <deskripsi gambar>\nContoh: /imagen pemandangan bulan di malam hari"
          : "💡 Use format: /imagen <image description>\nExample: /imagen landscape of the moon at night",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    user.limit -= 1;
    saveUser(ctx.from.id, user);

    await ctx.reply(
      isIndo
        ? "⏳ Membuat gambar, mohon tunggu sebentar..."
        : "⏳ Generating image, please wait..."
    );

    try {
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        input
      )}?nologo=true&width=1024&height=1024&seed=${Math.floor(
        Math.random() * 1000000
      )}`;

      const res = await fetch(pollinationsUrl);
      if (!res.ok) throw new Error("Pollinations failed");

      const buffer = await res.buffer();
      await ctx.replyWithPhoto(
        { source: buffer },
        {
          caption: isIndo
            ? `✨ *Gambar berhasil dibuat!*\n\n📝 *Prompt:* ${input}\n🤖 *Dibuat oleh ${bot_name}*`
            : `✨ *Image successfully generated!*\n\n📝 *Prompt:* ${input}\n🤖 *Powered by ${bot_name}*`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    } catch (err) {
      console.error("⚠️ Pollinations Error:", err.message);
    }

    try {
      const unsplashUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(input)}`;
      const res = await fetch(unsplashUrl);
      if (!res.ok) throw new Error("Unsplash failed");

      const buffer = await res.buffer();
      await ctx.replyWithPhoto(
        { source: buffer },
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

    try {
      const picsumUrl = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000000)}`;
      const res = await fetch(picsumUrl);
      if (!res.ok) throw new Error("Picsum failed");

      const buffer = await res.buffer();
      await ctx.replyWithPhoto(
        { source: buffer },
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
    console.error("❌ Error di /imagen:", err);
    ctx.reply(
      isIndo
        ? "Terjadi kesalahan saat memproses /imagen 😥"
        : "An error occurred while processing /imagen 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
