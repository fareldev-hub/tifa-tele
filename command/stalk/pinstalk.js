const axios = require("axios")

module.exports = async (ctx) => {
  const replyId = ctx.message.message_id
  let loadingMsg

  try {
    const query = ctx.message.text.split(" ").slice(1).join(" ").trim()
    if (!query) {
      return ctx.reply(
        "❌ Gunakan: <b>/pinstalk &lt;username&gt;</b>",
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    // 🔄 loading
    loadingMsg = await ctx.reply(
      "📌 Mengambil data Pinterest...",
      { reply_to_message_id: replyId }
    )

    const url = `https://api.siputzx.my.id/api/stalk/pinterest?q=${encodeURIComponent(query)}`
    const res = await axios.get(url)

    if (!res.data || !res.data.status) {
      throw new Error("Invalid API response")
    }

    const d = res.data.data

    // escape HTML
    const esc = (t = "") =>
      String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

    const caption = `
📌 <b>Pinterest Stalker</b>

<b>Username:</b> ${esc(d.username)}
<b>Nama:</b> ${esc(d.full_name || "-")}
<b>Bio:</b> ${esc(d.bio || "-")}
<b>Profil:</b> ${esc(d.profile_url)}

📊 <b>Statistik</b>
<b>Pins:</b> ${d.stats?.pins ?? 0}
<b>Boards:</b> ${d.stats?.boards ?? 0}
<b>Followers:</b> ${d.stats?.followers ?? 0}
<b>Following:</b> ${d.stats?.following ?? 0}

🏷️ <b>Akun</b>
<b>Verified:</b> ${Object.keys(d.is_verified || {}).length > 0}
<b>Partner:</b> ${d.is_partner}
<b>Employee:</b> ${d.is_employee}
<b>Created:</b> ${esc(d.created_at)}
`

    // 🗑️ hapus loading
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      loadingMsg.message_id
    )

    // 🖼️ kirim foto
    await ctx.replyWithPhoto(
      { url: d.image?.original || d.image?.large },
      {
        caption: caption.slice(0, 1024), // aman limit telegram
        parse_mode: "HTML",
        reply_to_message_id: replyId
      }
    )

  } catch (err) {
    console.error("❌ /pinstalk error:", err)

    if (loadingMsg) {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          loadingMsg.message_id
        )
      } catch {}
    }

    ctx.reply(
      "❌ Gagal mengambil data Pinterest.",
      { reply_to_message_id: replyId }
    )
  }
}
