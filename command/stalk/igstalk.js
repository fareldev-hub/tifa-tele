const axios = require("axios")

module.exports = async (ctx) => {
  const replyId = ctx.message.message_id
  let loadingMsg

  try {
    const username = ctx.message.text.split(" ").slice(1).join(" ")
    if (!username) {
      return ctx.reply(
        "❌ Gunakan: /igstalk &lt;username&gt;",
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    // 🔄 Loading
    loadingMsg = await ctx.reply(
      "📸 Mengambil data Instagram...",
      { reply_to_message_id: replyId }
    )

    const url = `https://api.siputzx.my.id/api/stalk/instagram?username=${encodeURIComponent(username)}`
    const res = await axios.get(url)

    if (!res.data || !res.data.status) {
      throw new Error("Invalid API response")
    }

    const d = res.data.data

    // escape HTML biar aman
    const esc = (t = "") =>
      t.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")

    const caption = `
📷 <b>Instagram Stalker</b>

<b>Username:</b> ${esc(d.username)}
<b>Nama:</b> ${esc(d.full_name || "-")}
<b>Bio:</b> ${esc(d.biography || "-")}
<b>Website:</b> ${esc(d.external_url || "-")}

👥 <b>Statistik</b>
<b>Followers:</b> ${d.followers_count}
<b>Following:</b> ${d.following_count}
<b>Postingan:</b> ${d.posts_count}

🏷️ <b>Akun</b>
<b>Private:</b> ${d.is_private}
<b>Verified:</b> ${d.is_verified}
<b>Business:</b> ${d.is_business_account}
`

    // 🗑️ hapus loading
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      loadingMsg.message_id
    )

    // 📸 kirim foto + caption
    await ctx.replyWithPhoto(
      { url: d.profile_pic_url },
      {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: replyId
      }
    )

  } catch (err) {
    console.error(err)

    if (loadingMsg) {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          loadingMsg.message_id
        )
      } catch {}
    }

    ctx.reply(
      `❌ igstalk error: ${err.message}`,
      { reply_to_message_id: replyId }
    )
  }
}
