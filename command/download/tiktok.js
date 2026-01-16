const axios = require("axios");
const { loadUser, saveUser } = require("../../handler");
const { downloadWithProgress } = require("../../lib/loading");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from.language_code || "en").startsWith("id");

    // === Load user & cek limit ===
    const user = loadUser(ctx.from.id) || { limit: 5 };
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Ambil URL ===
    const prompt = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!prompt) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan: /tiktok <url>"
          : "💡 Use: /tiktok <url>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Loading ===
    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil data TikTok..." : "⏳ Fetching TikTok data...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // === TikWM API ===
    const response = await axios.post("https://www.tikwm.com/api/", {
      url: prompt,
      hd: 1,
    });

    const result = response.data?.data;
    if (!result) throw new Error("Response tidak valid");

    // ================= VIDEO MODE =================
    if (result.play || result.hdplay) {
      const videoUrl = result.hdplay || result.play;
      if (!videoUrl) throw new Error("URL video tidak ditemukan");

      const videoBuffer = await downloadWithProgress(
        ctx,
        waitMsg,
        videoUrl,
        isIndo
          ? "📥 Mengunduh video..."
          : "📥 Downloading video...",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );

      let caption = `🎬 ${result.title || "Video TikTok"}\n👤 ${
        result.author?.nickname || "-"
      }`;

      if (caption.length > 1000) caption = undefined;

      await ctx.replyWithVideo(
        { source: Buffer.from(videoBuffer) },
        {
          caption,
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    }

    // ================= SLIDE / PHOTO MODE =================
    else if (Array.isArray(result.images) && result.images.length > 0) {
      const images = result.images;
      const batchSize = 10;

      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize).map((url) => ({
          type: "photo",
          media: url,
        }));

        // caption hanya di batch terakhir
        if (i + batchSize >= images.length) {
          let caption = `🖼️ ${
            isIndo ? "Slide TikTok selesai dikirim" : "TikTok slides sent"
          }\n👤 ${result.author?.nickname || "-"}`;

          if (caption.length <= 1000) {
            batch[batch.length - 1].caption = caption;
          }
        }

        try {
          await ctx.telegram.sendMediaGroup(ctx.chat.id, batch, {
            reply_to_message_id: ctx.message?.message_id,
          });
        } catch (err) {
          // fallback kirim satu-satu
          for (const [idx, img] of batch.entries()) {
            await ctx.replyWithPhoto(img.media, {
              caption:
                idx === batch.length - 1 ? img.caption : undefined,
              reply_to_message_id: ctx.message?.message_id,
            });
          }
        }
      }
    } else {
      throw new Error("Tidak ada media ditemukan");
    }

    // === Cleanup ===
    await ctx.telegram
      .deleteMessage(ctx.chat.id, waitMsg.message_id)
      .catch(() => {});

    user.limit -= 1;
    saveUser(ctx.from.id, user);

  } catch (err) {
    console.warn("⚠️ Error:", err.message);
    await ctx.reply(
      (ctx.from.language_code || "en").startsWith("id")
        ? "⚠️ Gagal memproses TikTok."
        : "⚠️ Failed to process TikTok.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
