const fetch = require("node-fetch");

// pastikan session global ada
global.gameSession = global.gameSession || new Map();

module.exports = async (ctx) => {
  // Guard: pastikan ada chat
  if (!ctx.chat) return;

  // helper kirim pesan AMAN
  const safeReply = async (method, ...args) => {
    try {
      return await ctx[method](...args);
    } catch (err) {
      // ❗ JANGAN balas apa pun jika bot sudah di-kick
      if (err?.response?.error_code === 403) {
        console.warn("⚠️ Bot tidak ada di chat, skip TebakFF");
        return null;
      }
      throw err;
    }
  };

  try {
    // ambil soal dari API
    const res = await fetch("https://api.deline.web.id/game/tebakff", {
      timeout: 30_000,
    });
    const json = await res.json();

    if (!json?.status || !json?.result) {
      throw new Error("API error");
    }

    const { img, jawaban, deskripsi } = json.result;

    // ambil gambar
    const imgRes = await fetch(img);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // kirim gambar
    const sent = await safeReply(
      "replyWithPhoto",
      { source: buffer },
      {
        caption:
          `🖼 <b>Tebak FF</b>\n\n` +
          `✍️ <i>Reply / geser pesan ini untuk menjawab</i>`,
        parse_mode: "HTML",
        allow_sending_without_reply: true,
        message_thread_id: ctx.message?.message_thread_id, // support topic
      }
    );

    if (!sent?.message_id) return;

    // simpan session
    global.gameSession.set(sent.message_id, {
      type: "tebakff",
      chatId: ctx.chat.id,
      userId: ctx.from.id,
      answer: jawaban.toLowerCase(),
      desc: deskripsi,
      wrong: 0,
    });

  } catch (err) {
    console.error("❌ TebakFF Error:", err);

    // ⚠️ JANGAN reply kalau bot sudah di-kick
    if (err?.response?.error_code === 403) return;

    try {
      await ctx.reply("❌ Gagal mengambil soal Tebak FF.", {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch {}
  }
};
