const fetch = require("node-fetch");

// pastikan session global ada
global.gameSession = global.gameSession || new Map();

module.exports = async (ctx) => {
  try {
    const res = await fetch("https://api.deline.web.id/game/siapakahaku");
    const json = await res.json();

    if (!json.status || !json.result) {
      throw new Error("API error");
    }

    const { soal, jawaban } = json.result;

    // kirim soal
    const sent = await ctx.reply(
      `❓ <b>Siapakah Aku?</b>\n\n` +
      `<b>Petunjuk:</b>\n${soal}\n\n` +
      `✍️ <i>Reply / geser pesan ini untuk menjawab</i>`,
      {
        parse_mode: "HTML",
        allow_sending_without_reply: true
      }
    );

    // simpan session (dipakai handler di index.js)
    global.gameSession.set(sent.message_id, {
      type: "siapakahaku",        // ⬅️ PENTING
      userId: ctx.from.id,
      answer: jawaban.toLowerCase(),
      wrong: 0
    });

  } catch (err) {
    console.error("❌ SiapakahAku Error:", err);
    ctx.reply("❌ Gagal mengambil soal Siapakah Aku.");
  }
};
