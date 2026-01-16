const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    const lang = (ctx.from?.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    
    if (user.limit <= 0) {
      const msg = isIndo
        ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
        : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }

    // Ambil teks tweet
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan format: /tweet <teks>\nContoh: `/tweet farel ganteng`"
          : "💡 Use format: /tweet <text>\nExample: `/tweet farel ganteng`",
        { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Kirim pesan loading
    await ctx.reply(
      lang === "id"
        ? "🕐 Sedang membuat tweet palsu..."
        : "🕐 Generating fake tweet...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Ambil foto profil Telegram user
    const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, { limit: 1 });
    let avatarUrl = "https://api.deline.web.id/6s92FCYONp.jpg"; // default avatar

    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      const file = await ctx.telegram.getFile(fileId);
      avatarUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;
    }

    // Detail tweet
    const name = ctx.from.first_name || "Anon";
    const username = ctx.from.username || "unknown_user";
    const tweetText = args;
    const theme = "light"; // bisa ganti ke "dark"
    const retweets = Math.floor(Math.random() * 5000) + 100;
    const quotes = Math.floor(Math.random() * 2000) + 50;
    const likes = Math.floor(Math.random() * 10000) + 500;
    const client = "Twitter for iPhone";
    const image = "null"; // tidak ada gambar

    // Buat URL API
    const apiUrl = `https://api.deline.web.id/maker/faketweet2?profile=${encodeURIComponent(
      avatarUrl
    )}&name=${encodeURIComponent(name)}&username=${encodeURIComponent(
      username
    )}&tweet=${encodeURIComponent(tweetText)}&image=${encodeURIComponent(
      image
    )}&theme=${theme}&retweets=${retweets}&quotes=${quotes}&likes=${likes}&client=${encodeURIComponent(
      client
    )}`;

    // Ambil hasil gambar
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("image")) {
      throw new Error("API tidak mengembalikan gambar yang valid.");
    }

    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // Kirim hasil gambar
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption:
          lang === "id"
            ? "✅ *Selesai membuat tweet palsu!*"
            : "✅ *Fake tweet created!*",
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
    user.limit -= 1;
    saveUser(ctx.from.id, user);
    
  } catch (err) {
    console.error("❌ Error di tweet.js:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat membuat tweet 😥"
        : "❌ An error occurred while generating the tweet 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
