const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    let targetId = null;
    let targetName = null;

    // 1️⃣ Jika command reply pesan
    if (ctx.message.reply_to_message) {
      targetId = ctx.message.reply_to_message.from.id;
      targetName = ctx.message.reply_to_message.from.first_name || "Unknown";
    }

    // Jika tidak ada target sama sekali, tampilkan ID pengirim
    if (!targetId) {
      targetId = ctx.from.id;
      targetName = ctx.from.first_name || "Unknown";
    }

    // Kirim ID
    const msg = `👤 *Nama:* ${targetName}\n🆔 *ID Telegram:* \`${targetId}\``;

    await ctx.reply(msg, { parse_mode: "Markdown", reply_to_message_id: ctx.message.message_id });

  } catch (err) {
    console.error("❌ Error di /getid:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses /getid 😥", { reply_to_message_id: ctx.message.message_id });
  }
};
