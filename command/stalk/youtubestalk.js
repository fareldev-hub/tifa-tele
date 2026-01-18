const axios = require("axios")

const esc = (t = "") =>
  String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

module.exports = async (ctx) => {
  const replyId = ctx.message.message_id
  let loadingMsg

  try {
    const username = ctx.message.text.split(" ").slice(1).join(" ").trim()
    if (!username) {
      return ctx.reply(
        "❌ Gunakan: <b>/youtubestalk &lt;username&gt;</b>",
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    loadingMsg = await ctx.reply(
      "📺 Mengambil data YouTube...",
      { reply_to_message_id: replyId }
    )

    const apiUrl = `https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(username)}`
    const res = await axios.get(apiUrl, {
      validateStatus: () => true // ⬅️ penting
    })

    // 🟥 API ERROR (500)
    if (res.status === 500) {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id)
      return ctx.reply(
        "⚠️ <b>Server YouTube sedang bermasalah.</b>\nCoba lagi beberapa saat.",
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    // ❌ NOT FOUND
    if (!res.data?.status || !res.data?.data?.channel) {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id)
      return ctx.reply(
        `❌ Channel <b>${esc(username)}</b> tidak ditemukan.`,
        { reply_to_message_id: replyId, parse_mode: "HTML" }
      )
    }

    const ch = res.data.data.channel
    const vids = res.data.data.latest_videos || []

    let videoText = ""
    vids.slice(0, 3).forEach((v, i) => {
      videoText += `
${i + 1}. <b>${esc(v.title)}</b>
👁️ ${esc(v.viewCount)} • ⏱️ ${esc(v.duration)}
📅 ${esc(v.publishedTime)}
🔗 ${esc(v.videoUrl)}
`
    })

    const caption = `
📺 <b>YouTube Stalker</b>

<b>Username:</b> ${esc(ch.username)}
<b>Subscribers:</b> ${esc(ch.subscriberCount)}
<b>Videos:</b> ${esc(ch.videoCount)}
<b>Channel:</b> ${esc(ch.channelUrl)}

📝 <b>Deskripsi</b>
${esc(ch.description || "-")}

🎬 <b>Video Terbaru</b>
${videoText || "Tidak ada video"}
`

    // 🖼️ ambil avatar pakai arraybuffer
    let imageBuffer
    try {
      const img = await axios.get(ch.avatarUrl, { responseType: "arraybuffer" })
      imageBuffer = Buffer.from(img.data)
    } catch {
      imageBuffer = null
    }

    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id)

    if (imageBuffer) {
      await ctx.replyWithPhoto(
        { source: imageBuffer },
        {
          caption: caption.slice(0, 1024),
          parse_mode: "HTML",
          reply_to_message_id: replyId
        }
      )
    } else {
      await ctx.reply(
        caption.slice(0, 4096),
        { parse_mode: "HTML", reply_to_message_id: replyId }
      )
    }

  } catch (err) {
    console.error("❌ /youtubestalk fatal error:", err)

    if (loadingMsg) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id)
      } catch {}
    }

    ctx.reply(
      "❌ Terjadi kesalahan internal.",
      { reply_to_message_id: replyId }
    )
  }
}
