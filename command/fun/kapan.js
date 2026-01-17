const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    // Cek hanya private chat
    if (!ctx.chat || ctx.chat.type !== "private") {
      return ctx.reply("❌ Perintah /apakah hanya bisa digunakan di chat pribadi!");
    }

    // Ambil teks pertanyaan dari user
    const question = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!question) {
      return ctx.reply("💡 Gunakan format:\n/apakah <pertanyaanmu>");
    }

    // List jawaban random
    const answers = [
      "1 abad lagi",
      "Besok",
      "Nanti",
      "Ada masanya",
      "Tidak akan",
      "Tahun depan",
      "3 tahun lagi",
      "4 bulan lagi",
      "Tahun depan (mungkin)",
      "2 Bulan lagi",
      "3 minggu lagi",
      "Tau mimpi??",
      "ga akan"
    ];

    // Pilih jawaban random
    const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

    // Kirim balasan
    await ctx.reply(
      `❓ Pertanyaan: ${question}\n\n💬 Jawaban: ${randomAnswer}`,
      { reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di /apakah:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses pertanyaan 😥", {
      reply_to_message_id: ctx.message?.message_id
    });
  }
};
