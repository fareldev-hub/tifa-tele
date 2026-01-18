const axios = require("axios");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    // Ambil prompt
    const text = ctx.message?.text || "";
    const prompt = text.split(" ").slice(1).join(" ").trim();

    if (!prompt) {
      return ctx.reply(
        isIndo
          ? "🎨 Gunakan: /magicstudio <prompt>\nContoh: /magicstudio bulan di langit ungu"
          : "🎨 Use: /magicstudio <prompt>\nExample: /magicstudio moon in purple sky",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Loading
    const loading = await ctx.reply(
      isIndo
        ? "✨ Membuat gambar dengan Magic Studio..."
        : "✨ Generating image with Magic Studio...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Fetch data Magic Studio
    const res = await axios.get(
      "https://endpoint-hub.up.railway.app/api/image/magicstudio",
      {
        params: { text: prompt },
        timeout: 60_000,
      }
    );

    const json = res.data;
    if (!json?.ok || !json.image) {
      throw new Error("Invalid API response");
    }

    // Fetch image sebagai arraybuffer
    const imgRes = await axios.get(json.image, {
      responseType: "arraybuffer",
      timeout: 60_000,
    });

    const imageBuffer = Buffer.from(imgRes.data);

    // Hapus loading
    if (loading?.message_id) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loading.message_id)
        .catch(() => {});
    }

    // Kirim hasil gambar
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption: `✨ <b>Magic Studio</b>\n\n🖌️ <b>Prompt:</b> ${prompt}`,
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ /magicstudio error:", err);

    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "⚠️ Gagal membuat gambar."
        : "⚠️ Failed to generate image.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
