const fetch = require("node-fetch");
const axios = require("axios");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const input = ctx.message.text.split(" ")[1];

    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan: /ytmp3 <link YouTube>"
          : "💡 Use: /ytmp3 <YouTube link>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const waitMsg = await ctx.reply(
      isIndo ? "🎧 Mengambil audio..." : "🎧 Fetching audio...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 ENDPOINT DELINE (FIX)
    const apiUrl =
      `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(input)}`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    // ✅ VALIDASI RESPONSE SESUAI JSON
    if (
      !json ||
      json.status !== true ||
      !json.result ||
      typeof json.result.dlink !== "string"
    ) {
      throw new Error("Response API tidak valid");
    }

    const {
      youtube,
      pick,
      dlink
    } = json.result;

    // ⬇️ DOWNLOAD AUDIO (ARRAYBUFFER)
    const audioRes = await axios.get(dlink, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      },
      timeout: 60000
    });

    // 🚀 KIRIM AUDIO
    await ctx.replyWithAudio(
      {
        source: Buffer.from(audioRes.data),
        filename: `${youtube?.title || "audio"}.mp3`
      },
      {
        title: youtube?.title,
        performer: "YouTube",
        caption: isIndo
          ? `✅ Audio berhasil diunduh\n🎧 ${youtube?.title}\n📦 ${pick?.size || "-"}`
          : `✅ Audio downloaded\n🎧 ${youtube?.title}\n📦 ${pick?.size || "-"}`,
        reply_to_message_id: ctx.message?.message_id
      }
    );

    // 🧹 HAPUS PESAN LOADING
    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

  } catch (err) {
    console.error("❌ YTMP3 ERROR:", err.message);
    await ctx.reply(
      "❌ Gagal mengunduh audio.\nPastikan link valid dan coba lagi.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
