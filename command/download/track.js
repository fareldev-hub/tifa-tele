const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0) {
      return ctx.reply(
        lang === "id"
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const query = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!query) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan: /track <judul lagu>"
          : "💡 Use: /track <song title>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    await ctx.reply(
      lang === "id"
        ? `🔍 Mencari *${query}*...`
        : `🔍 Searching *${query}*...`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );

    user.limit -= 1;
    saveUser(ctx.from.id, user);

    const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&limit=1`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json.results || json.results.length === 0) {
      return ctx.reply(
        lang === "id"
          ? "⚠️ Lagu tidak ditemukan."
          : "⚠️ Song not found.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const song = json.results[0];

    const title = song.trackName;
    const artist = song.artistName;
    const album = song.collectionName;
    const cover = song.artworkUrl100.replace("100x100", "600x600");
    const preview = song.previewUrl;
    const duration = Math.floor(song.trackTimeMillis / 1000);

    const audioRes = await fetch(preview);
    const buffer = Buffer.from(await audioRes.arrayBuffer());

    await ctx.replyWithAudio(
      { source: buffer, filename: `${title}.m4a` },
      {
        title,
        performer: artist,
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (e) {
    console.error(e);
    ctx.reply("❌ Error memutar lagu.", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
