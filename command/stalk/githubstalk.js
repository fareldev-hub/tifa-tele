const axios = require("axios")

module.exports = async (ctx) => {
  const replyId = ctx.message.message_id

  let loadingMsg
  try {
    const text = ctx.message.text.split(" ").slice(1).join(" ")
    if (!text) {
      return ctx.reply(
        "❌ Gunakan: /stalkgithub <username>",
        { reply_to_message_id: replyId }
      )
    }

    // 🔄 Loading message
    loadingMsg = await ctx.reply(
      "🔍 Mengambil data GitHub...",
      { reply_to_message_id: replyId }
    )

    const url = `https://api.siputzx.my.id/api/stalk/github?user=${encodeURIComponent(text)}`
    const res = await axios.get(url)

    if (!res.data || !res.data.status) {
      throw new Error("Invalid API response")
    }

    const d = res.data.data

    const caption = `
🐙 *GitHub Stalker*

• *Username:* ${d.username}
• *Nickname:* ${d.nickname || "-"}
• *Bio:* ${d.bio || "-"}
• *ID:* ${d.id}
• *Type:* ${d.type}
• *Admin:* ${d.admin}
• *Company:* ${d.company || "-"}
• *Blog:* ${d.blog || "-"}
• *Location:* ${d.location || "-"}
• *Email:* ${d.email || "-"}

📦 *Repository*
• Public Repo: ${d.public_repo}
• Public Gist: ${d.public_gists}

👥 *Social*
• Followers: ${d.followers}
• Following: ${d.following}

📅 *Created:* ${new Date(d.created_at).toLocaleString()}
🔄 *Updated:* ${new Date(d.updated_at).toLocaleString()}

🔗 ${d.url}
`

    // 🗑️ Hapus loading
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      loadingMsg.message_id
    )

    // 📸 Kirim hasil
    await ctx.replyWithPhoto(
      { url: d.profile_pic },
      {
        caption,
        parse_mode: "Markdown",
        reply_to_message_id: replyId
      }
    )
  } catch (err) {
    console.error(err)

    // Hapus loading kalau error
    if (loadingMsg) {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          loadingMsg.message_id
        )
      } catch {}
    }

    ctx.reply(
      `❌ /stalkgithub error: ${err.message}`,
      { reply_to_message_id: replyId }
    )
  }
}
