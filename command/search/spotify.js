const fetch = require("node-fetch");

/* =====================
   MARKDOWN ESCAPE
===================== */
const escapeMD = (text = "") =>
  text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");

module.exports = async (ctx) => {
  try {
    if (!ctx.message || !ctx.from) return;

    const lang = (ctx.from.language_code || "").startsWith("id") ? "id" : "en";

    /* =====================
       QUERY
    ===================== */
    const text = ctx.message.text || "";
    const query = text.split(" ").slice(1).join(" ").trim();

    if (!query) {
      return ctx.reply(
        lang === "id"
          ? "💡 Gunakan: /spotify <judul lagu>"
          : "💡 Use: /spotify <song title>",
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    await ctx.reply(
      lang === "id"
        ? `🔍 Mencari *${escapeMD(query)}* di Spotify...`
        : `🔍 Searching *${escapeMD(query)}* on Spotify...`,
      {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );

    /* =====================
       FETCH API
    ===================== */
    const apiUrl = `https://api.baguss.xyz/api/search/spotify?q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("API request failed");

    const json = await res.json();
    if (!json?.success || !json.data?.length) {
      return ctx.reply(
        lang === "id" ? "⚠️ Lagu tidak ditemukan." : "⚠️ Song not found.",
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    const first = json.data[0];

    /* =====================
       LIST RESULT
    ===================== */
    const maxList = 5;
    const listText = json.data
      .slice(0, maxList)
      .map((v, i) => {
        return (
          `*${i + 1}. ${escapeMD(v.title)}*\n` +
          `👤 ${escapeMD(v.artist)}\n` +
          `🕓 ${v.duration}\n` +
          `🔗 ${v.track_url}`
        );
      })
      .join("\n\n");

    /* =====================
       CAPTION
    ===================== */
    const caption =
      lang === "id"
        ? `🎧 *HASIL SPOTIFY*

🎵 ${escapeMD(first.title)}
👤 ${escapeMD(first.artist)}
💿 ${escapeMD(first.album)}
🕓 ${first.duration}
📅 ${first.release_date}
🔗 ${first.track_url}

━━━━━━━━━━━━━━━
📃 *Lainnya:*

${listText}

💡 /play <judul lagu>`
        : `🎧 *SPOTIFY RESULT*

🎵 ${escapeMD(first.title)}
👤 ${escapeMD(first.artist)}
💿 ${escapeMD(first.album)}
🕓 ${first.duration}
📅 ${first.release_date}
🔗 ${first.track_url}

━━━━━━━━━━━━━━━
📃 *Others:*

${listText}

💡 /play <song title>`;

    /* =====================
       SEND RESULT
    ===================== */
    await ctx.replyWithPhoto(
      { url: first.thumbnail },
      {
        caption,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );
  } catch (err) {
    console.error("❌ /spotify error:", err.message);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan."
        : "❌ An error occurred.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
