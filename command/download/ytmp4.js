const fetch = require("node-fetch");
const axios = require("axios");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const input = ctx.message.text.split(" ")[1];

    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan: /ytmp4 <link YouTube>"
          : "💡 Use: /ytmp4 <YouTube link>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const waitMsg = await ctx.reply(
      isIndo ? "🎬 Mengambil video..." : "🎬 Fetching video...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 ENDPOINT DELINE (FIX)
    const apiUrl =
      `https://api.deline.web.id/downloader/ytmp4?url=${encodeURIComponent(input)}`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    // ✅ VALIDASI RESPONSE
    if (
      !json ||
      json.status !== true ||
      !json.result ||
      typeof json.result.downloadUrl !== "string"
    ) {
      throw new Error("Response API tidak valid");
    }

    const videoUrl = json.result.downloadUrl;

    // ⬇️ DOWNLOAD VIDEO (ARRAYBUFFER)
    const videoRes = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      },
      timeout: 120000
    });

    // 🚀 KIRIM VIDEO
    await ctx.replyWithVideo(
      {
        source: Buffer.from(videoRes.data)
      },
      {
        caption: isIndo
          ? "✅ Video berhasil diunduh"
          : "✅ Video downloaded successfully",
        reply_to_message_id: ctx.message?.message_id
      }
    );

    // 🧹 HAPUS PESAN LOADING
    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

  } catch (err) {
    console.error("❌ YTMP4 ERROR:", err.message);
    await ctx.reply(
      "❌ Gagal mengunduh video.\nPastikan link valid dan coba lagi.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
