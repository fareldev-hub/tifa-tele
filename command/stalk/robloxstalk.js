const axios = require("axios")

module.exports = async (ctx) => {
  const replyId = ctx.message.message_id
  let loadingMsg

  try {
    const username = ctx.message.text.split(" ").slice(1).join(" ").trim()
    if (!username) {
      return ctx.reply(
        "❌ Gunakan: <b>/robloxstalk &lt;username&gt;</b>",
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    // 🔄 loading
    loadingMsg = await ctx.reply(
      "🎮 Mengambil data Roblox...",
      { reply_to_message_id: replyId }
    )

    const url = `https://api.siputzx.my.id/api/stalk/roblox?user=${encodeURIComponent(username)}`
    const res = await axios.get(url)

    // ❌ user tidak ditemukan
    if (!res.data || !res.data.status || !res.data.data?.basic) {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id)

      return ctx.reply(
        `❌ Akun Roblox <b>${username}</b> tidak ditemukan.`,
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    const d = res.data.data
    const b = d.basic
    const s = d.social

    const esc = (t = "") =>
      String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

    const caption = `
🎮 <b>Roblox Stalker</b>

<b>Username:</b> ${esc(b.name)}
<b>Display Name:</b> ${esc(b.displayName)}
<b>User ID:</b> ${b.id}
<b>Verified:</b> ${b.hasVerifiedBadge}
<b>Banned:</b> ${b.isBanned}

📅 <b>Akun</b>
<b>Dibuat:</b> ${esc(b.created)}
<b>Deskripsi:</b> ${esc(b.description || "-")}

👥 <b>Sosial</b>
<b>Followers:</b> ${s.followers.count.toLocaleString()}
<b>Following:</b> ${s.following.count.toLocaleString()}
<b>Friends:</b> ${s.friends.count.toLocaleString()}

👪 <b>Group:</b> ${d.groups.list.data.length}
🏆 <b>Badge Roblox:</b> ${d.achievements.robloxBadges?.length || 0}
`

    const avatar =
      d.avatar?.headshot?.data?.[0]?.imageUrl ||
      d.avatar?.bust?.data?.[0]?.imageUrl ||
      d.avatar?.fullBody?.data?.[0]?.imageUrl

    // 🗑️ hapus loading
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      loadingMsg.message_id
    )

    await ctx.replyWithPhoto(
      { url: avatar },
      {
        caption: caption.slice(0, 1024),
        parse_mode: "HTML",
        reply_to_message_id: replyId
      }
    )

  } catch (err) {
    console.error("❌ /robloxstalk error:", err)

    if (loadingMsg) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id)
      } catch {}
    }

    ctx.reply(
      "❌ Terjadi kesalahan saat mengambil data Roblox.",
      { reply_to_message_id: replyId }
    )
  }
}
