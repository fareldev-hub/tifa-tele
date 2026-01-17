const fetch = require("node-fetch");

// pastikan session global ada
global.gameSession = global.gameSession || new Map();

module.exports = async (ctx) => {
  try {
    // ambil soal dari API
    const res = await fetch("https://api.deline.web.id/game/tebakheroml");
    const json = await res.json();

    if (!json.status || !json.result) {
      throw new Error("API error");
    }

    const { img, fullimg, jawaban, deskripsi } = json.result;

    // ambil gambar sebagai arrayBuffer
    const imgRes = await fetch(img);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // kirim gambar + caption soal
    const sent = await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption:
          `🖼 <b>Tebak Hero ML</b>\n\n` +
          `✍️ <i>Reply / geser pesan ini untuk menjawab</i>`,
        parse_mode: "HTML",
        allow_sending_without_reply: true
      }
    );

    // simpan session untuk handler di index.js
    global.gameSession.set(sent.message_id, {
      type: "tebakheroml",       // penting untuk handler
      userId: ctx.from.id,
      answer: jawaban.toLowerCase(),
      desc: deskripsi,
      wrong: 0
    });

  } catch (err) {
    console.error("❌ TebakHeroML Error:", err);
    ctx.reply("❌ Gagal mengambil soal Tebak Hero ML.");
  }
};
