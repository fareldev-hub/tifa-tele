const fetch = require("node-fetch");

// pastikan session global ada
global.gameSession = global.gameSession || new Map();

module.exports = async (ctx) => {
  try {
    const res = await fetch("https://api.deline.web.id/game/caklontong");
    const json = await res.json();

    if (!json.status || !json.data) {
      throw new Error("API error");
    }

    const { soal, jawaban, deskripsi, index } = json.data;

    // kirim soal
    const sent = await ctx.reply(
      `🤪 <b>Cak Lontong</b>\n\n` +
      `<b>Tebakan:</b>\n${soal}\n\n` +
      `✍️ <i>Reply / geser pesan ini untuk menjawab</i>`,
      {
        parse_mode: "HTML",
        allow_sending_without_reply: true
      }
    );

    // simpan session (dipakai handler di index.js)
    global.gameSession.set(sent.message_id, {
      type: "caklontong",          // ⬅️ PENTING
      userId: ctx.from.id,
      answer: jawaban.toLowerCase(),
      desc: deskripsi,             // ⬅️ dipakai saat benar / salah 3x
      wrong: 0,
      index
    });

  } catch (err) {
    console.error("❌ CakLontong Error:", err);
    ctx.reply("❌ Gagal mengambil soal Cak Lontong.");
  }
};
