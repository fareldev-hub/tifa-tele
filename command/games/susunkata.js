const fetch = require("node-fetch");

// pastikan session global ada
global.gameSession = global.gameSession || new Map();

module.exports = async (ctx) => {
  try {
    const res = await fetch("https://api.deline.web.id/game/susunkata");
    const json = await res.json();

    if (!json.status || !json.result) {
      throw new Error("API error");
    }

    const { soal, tipe, jawaban } = json.result;

    // kirim soal
    const sent = await ctx.reply(
      `🔤 <b>Susun Kata</b>\n\n` +
      `<b>Tipe:</b> ${tipe}\n` +
      `<b>Petunjuk:</b> ${soal}\n\n` +
      `✍️ <i>Reply / geser pesan ini untuk menjawab</i>`,
      {
        parse_mode: "HTML",
        allow_sending_without_reply: true
      }
    );

    // simpan session (dipakai handler di index.js)
    global.gameSession.set(sent.message_id, {
      type: "susunkata",      // penting
      userId: ctx.from.id,
      answer: jawaban.toLowerCase(),
      wrong: 0
    });

  } catch (err) {
    console.error("❌ SusunKata Error:", err);
    ctx.reply("❌ Gagal mengambil soal Susun Kata.");
  }
};
