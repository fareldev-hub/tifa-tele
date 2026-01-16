const axios = require("axios");
const fs = require("fs");
const { loadUser, saveUser } = require("../../handler");
const { makePlayCard } = require("../../canvas/playCard");

module.exports = async (ctx) => {
  let imgPath;

  try {
    if (!ctx.message || !ctx.from) return;

    const isIndo = (ctx.from.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    /* =====================
       LIMIT
    ===================== */
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit harian kamu sudah habis."
          : "🚫 Your daily limit has run out.",
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    /* =====================
       QUERY
    ===================== */
    const text = ctx.message.text || "";
    const query = text.split(" ").slice(1).join(" ").trim();

    if (!query) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan: /play <judul lagu>"
          : "💡 Use: /play <song title>",
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    await ctx.reply(
      isIndo
        ? `🔍 Mencari *${query}*...`
        : `🔍 Searching *${query}*...`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message.message_id }
    );

    /* =====================
       SEARCH
    ===================== */
    const search = await axios.get(
      "https://api.baguss.xyz/api/search/spotify",
      { params: { q: query } }
    );

    const data = search.data;
    if (!data?.success || !data.data?.length) {
      return ctx.reply(
        isIndo ? "⚠️ Lagu tidak ditemukan." : "⚠️ Song not found.",
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    const song = data.data[0];
    const { title, artist, duration, thumbnail, track_url } = song;

    /* =====================
       LIMIT --
    ===================== */
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    /* =====================
       CANVAS
    ===================== */
    imgPath = await makePlayCard({
      title,
      duration,
      coverUrl: thumbnail,
    });

    await ctx.replyWithPhoto(
      { source: imgPath },
      {
        caption: isIndo
          ? `🎵 *${title}*\n👤 ${artist}\n🕓 ${duration}\n\n⬇️ Mengunduh audio...`
          : `🎵 *${title}*\n👤 ${artist}\n🕓 ${duration}\n\n⬇️ Downloading audio...`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );

    /* =====================
       DOWNLOAD
    ===================== */
    const down = await axios.get(
      "https://api.siputzx.my.id/api/d/spotifyv2",
      { params: { url: track_url } }
    );

    const mp3 = down.data?.data?.mp3DownloadLink;
    if (!mp3) throw new Error("Download link not found");

    const audio = await axios.get(mp3, { responseType: "arraybuffer" });

    await ctx.replyWithAudio(
      { source: Buffer.from(audio.data), filename: `${title}.mp3` },
      {
        title,
        performer: artist,
        caption: `🎶 *${title}* — ${artist}`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );

  } catch (err) {
    console.error("❌ /play error:", err);

    await ctx.reply(
      (ctx.from.language_code || "").startsWith("id")
        ? "❌ Gagal memutar lagu."
        : "❌ Failed to play the song.",
      { reply_to_message_id: ctx.message?.message_id }
    );

  } finally {
    if (imgPath && fs.existsSync(imgPath)) {
      try {
        fs.unlinkSync(imgPath);
      } catch {}
    }
  }
};
