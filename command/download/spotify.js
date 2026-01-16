const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { downloadWithProgress } = require("../../lib/loading");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const isIndo = lang === "id";

    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // 🔒 Cek limit user
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🎯 Ambil URL Spotify dari pesan
    const url = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!url || !url.includes("spotify.com")) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /spotify <link_spotify>\nContoh: `/spotify https://open.spotify.com/track/...`"
          : "💡 Use format: /spotify <spotify_link>\nExample: `/spotify https://open.spotify.com/track/...`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🕐 Pesan loading awal
    const processMsg = await ctx.reply(
      isIndo
        ? "🎧 Sedang memproses lagu dari Spotify..."
        : "🎧 Fetching song from Spotify...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🌐 Ambil data dari API Siputzx
    const apiUrl = `https://api.siputzx.my.id/api/d/spotifyv2?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (!json.status || !json.data) throw new Error("Gagal mengambil data dari API.");

    const data = json.data;
    const {
      title,
      artist,
      songTitle,
      coverImage,
      mp3DownloadLink,
      url: spotifyLink,
    } = data;

    // 🚫 Cek apakah link MP3 valid
    if (!mp3DownloadLink || !mp3DownloadLink.startsWith("http")) {
      await ctx.telegram.deleteMessage(ctx.chat.id, processMsg.message_id).catch(() => {});
      return ctx.replyWithPhoto(
        { url: coverImage },
        {
          caption:
            isIndo
              ? `🎵 *${songTitle || title}*\n👤 Artis: *${artist}*\n\n⚠️ Lagu tidak dapat diunduh saat ini. Silakan coba lagi nanti.`
              : `🎵 *${songTitle || title}*\n👤 Artist: *${artist}*\n\n⚠️ This song cannot be downloaded right now. Please try again later.`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    }

    // 📥 Unduh file audio dengan progress realtime
    const audioBuffer = await downloadWithProgress(
      ctx,
      processMsg,
      mp3DownloadLink,
      isIndo
        ? "📥 Mengunduh lagu dari server Spotify..."
        : "📥 Downloading song from Spotify...",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    // 🎶 Kirim sebagai audio Telegram
    await ctx.replyWithAudio(
      { source: Buffer.from(audioBuffer), filename: `${artist || "Unknown"} - ${songTitle || title}.mp3` },
      {
        caption:
          isIndo
            ? `🎵 *${songTitle || title}*\n👤 Artis: *${artist}*\n🔗 [Dengarkan di Spotify](${spotifyLink})`
            : `🎵 *${songTitle || title}*\n👤 Artist: *${artist}*\n🔗 [Listen on Spotify](${spotifyLink})`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
        thumb: { url: coverImage },
      }
    );

    // 🧹 Hapus pesan loading setelah selesai
    await ctx.telegram.deleteMessage(ctx.chat.id, processMsg.message_id).catch(() => {});

    // 💰 Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

  } catch (err) {
    console.error("❌ Error di spotify.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat memproses lagu Spotify 😥"
        : "❌ An error occurred while processing Spotify track 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
