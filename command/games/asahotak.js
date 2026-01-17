const fetch = require("node-fetch");

// pastikan session global ada
global.gameSession = global.gameSession || new Map();

module.exports = async (ctx) => {
  try {
    const res = await fetch("https://api.deline.web.id/game/asahotak");
    const json = await res.json();

    if (!json.status || !json.data) {
      throw new Error("API error");
    }

    const { soal, jawaban, index } = json.data;

    // kirim soal
    const sent = await ctx.reply(
      `🧠 <b>Asah Otak</b>\n\n` +
      `<b>Pertanyaan:</b>\n${soal}\n\n` +
      `✍️ <i>Reply / geser pesan ini untuk menjawab</i>`,
      {
        parse_mode: "HTML",
        allow_sending_without_reply: true
      }
    );

    // simpan session (SESUIAI handler di index.js)
    global.gameSession.set(sent.message_id, {
      type: "asahotak",           // ⬅️ PENTING (dipakai handler)
      userId: ctx.from.id,
      answer: jawaban.toLowerCase(),
      wrong: 0,
      index
    });

  } catch (err) {
    console.error("❌ AsahOtak Error:", err);
    ctx.reply("❌ Gagal mengambil soal Asah Otak.");
  }
};
