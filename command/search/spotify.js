const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

/* === Escape HTML === */
const escapeHTML = (text = "") =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* === Spotify Command === */
module.exports = async (ctx) => {
  try {
    if (!ctx.message || !ctx.from) return;

    const lang = (ctx.from.language_code || "").startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    /* =====================
       QUERY
    ===================== */
    const text = ctx.message.text || "";
    const query = text.split(" ").slice(1).join(" ").trim();

    if (!query) {
      return ctx.reply(
        lang === "id"
          ? "💡 <b>Cara pakai:</b>\n<code>/spotify judul lagu</code>"
          : "💡 <b>Usage:</b>\n<code>/spotify song title</code>",
        {
          parse_mode: "HTML",
          reply_to_message_id: ctx.message.message_id,
        }
      );
    }

    if (user.limit <= 0) {
      return ctx.reply(
        lang === "id"
          ? "🚫 <b>Limit habis!</b>\n⏳ Reset otomatis setiap 24 jam."
          : "🚫 <b>Daily limit reached!</b>\n⏳ Resets every 24 hours.",
        {
          parse_mode: "HTML",
          reply_to_message_id: ctx.message.message_id,
        }
      );
    }

    await ctx.reply(
      lang === "id"
        ? `🔍 <b>Mencari di Spotify...</b>\n🎵 <i>${escapeHTML(query)}</i>`
        : `🔍 <b>Searching on Spotify...</b>\n🎵 <i>${escapeHTML(query)}</i>`,
      {
        parse_mode: "HTML",
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
        lang === "id"
          ? "⚠️ <b>Lagu tidak ditemukan.</b>"
          : "⚠️ <b>Song not found.</b>",
        {
          parse_mode: "HTML",
          reply_to_message_id: ctx.message.message_id,
        }
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
          `<b>${i + 1}. ${escapeHTML(v.title)}</b>\n` +
          `👤 ${escapeHTML(v.artist)}\n` +
          `🕓 <code>${v.duration}</code>\n` +
          `🔗 <a href="${v.track_url}">Spotify</a>`
        );
      })
      .join("\n\n");

    /* =====================
       CAPTION HTML
    ===================== */
    const caption =
      lang === "id"
        ? `🎧 <b>HASIL PENCARIAN SPOTIFY</b>

🎵 <b>${escapeHTML(first.title)}</b>
👤 ${escapeHTML(first.artist)}
💿 ${escapeHTML(first.album)}
🕓 <code>${first.duration}</code>
📅 ${first.release_date}
🔗 <a href="${first.track_url}">Buka di Spotify</a>

━━━━━━━━━━━━━━━
📃 <b>Lagu Lainnya:</b>

${listText}

💡 <i>Ketik</i> <code>/play judul lagu</code>`
        : `🎧 <b>SPOTIFY SEARCH RESULT</b>

🎵 <b>${escapeHTML(first.title)}</b>
👤 ${escapeHTML(first.artist)}
💿 ${escapeHTML(first.album)}
🕓 <code>${first.duration}</code>
📅 ${first.release_date}
🔗 <a href="${first.track_url}">Open on Spotify</a>

━━━━━━━━━━━━━━━
📃 <b>Other Results:</b>

${listText}

💡 <i>Type</i> <code>/play song title</code>`;

    /* =====================
       SEND RESULT
    ===================== */
    await ctx.replyWithPhoto(
      { url: first.thumbnail },
      {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: ctx.message.message_id,
      }
    );

    user.limit -= 1;
    saveUser(ctx.from.id, user);
  } catch (err) {
    console.error("❌ /spotify error:", err.message);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ <b>Terjadi kesalahan.</b>"
        : "❌ <b>An error occurred.</b>",
      {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  }
};
