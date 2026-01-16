const fetch = require("node-fetch");

module.exports = async (ctx) => {
  try {
    if (!ctx.message || !ctx.from) return;

    const lang = (ctx.from.language_code || "").startsWith("id") ? "id" : "en";

    /* =====================
       QUERY (SAFE)
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
        ? `🔍 Mencari *${query}* di Spotify...`
        : `🔍 Searching *${query}* on Spotify...`,
      {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );

    /* =====================
       SEARCH
    ===================== */
    const url = `https://api.baguss.xyz/api/search/spotify?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);

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
       LIMIT CAPTION
    ===================== */
    const maxList = 5;
    const listText = json.data
      .slice(0, maxList)
      .map(
        (v, i) =>
          `*${i + 1}. ${v.title}*\n👤 ${v.artist}\n🕓 ${v.duration}`
      )
      .join("\n\n");

    const caption =
      lang === "id"
        ? `🎧 *HASIL SPOTIFY*

🎵 ${first.title}
👤 ${first.artist}
💿 ${first.album}
🕓 ${first.duration}
📅 ${first.release_date}

━━━━━━━━━━━━━━━
📃 *Lainnya:*

${listText}

💡 /play <judul lagu>`
        : `🎧 *SPOTIFY RESULT*

🎵 ${first.title}
👤 ${first.artist}
💿 ${first.album}
🕓 ${first.duration}
📅 ${first.release_date}

━━━━━━━━━━━━━━━
📃 *Others:*

${listText}

💡 /play <song title>`;

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
