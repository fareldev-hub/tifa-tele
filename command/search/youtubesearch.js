const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const isIndo = lang === "id";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // 🔒 Cek limit user
    if (user.limit <= 0) {
      const msg = isIndo
        ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
        : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }

    // Ambil input (judul video)
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /youtubesearch <judul_video>"
          : "💡 Use format: /youtubesearch <video_title>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    await ctx.reply(isIndo ? "⏳ Mencari video di YouTube..." : "⏳ Searching YouTube...");

    // 🔗 API pencarian YouTube
    const apiUrl = "https://api.deline.web.id/search/youtube?q=" + encodeURIComponent(input);
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !data?.result || data.result.length === 0) {
      throw new Error(isIndo ? "❌ Video tidak ditemukan." : "❌ No video found.");
    }

    // Ambil video pertama
    const video = data.result[0];

    // Caption dengan <pre> untuk monospace
    const caption = "🎬 <b>" + video.title + "</b>\n" +
                    "👤 Channel: " + video.channel + "\n" +
                    "⏱ Duration: " + video.duration + "\n" +
                    "🔗 <a href=\"" + video.link + "\">Tonton di YouTube</a>\n\n" +
                    "💡 " + (isIndo ? "Gunakan perintah di bawah untuk mengunduh:" : "Use the commands below to download:") + "\n\n" +
                    "<b><code>/ytmp4 " + video.link + "</code></b>\n\n" +
                    "<b><code>/ytmp3 " + video.link + "</code></b>";

    await ctx.replyWithPhoto(
      { url: video.imageUrl },
      { caption: caption, parse_mode: "HTML" }
    );

    // Kurangi limit
    user.limit -= 1;
    saveUser(ctx.from.id, user);

  } catch (err) {
    console.error("❌ Error di /youtubesearch:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat mencari video 😥"
        : "❌ An error occurred while searching the video 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
