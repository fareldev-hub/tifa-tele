const { loadUser, saveUser } = require("../../handler");
const { bot_name, owner_id, owner_name } = require("../../settings");

const OWNER_USERNAME = owner_name
const OWNER_ID = owner_id

module.exports = async (ctx) => {
  try {
    const sender = ctx.from;

    // === CEK OWNER ===
    const isOwner =
      sender.username === OWNER_USERNAME ||
      sender.id === OWNER_ID;

    if (!isOwner) {
      return ctx.reply("🚫 Kamu tidak punya izin menggunakan perintah ini!", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === AMBIL ARGUMEN ===
    const args = ctx.message.text.split(" ").slice(1);
    let targetId = args[0];
    const value = parseInt(args[1]);

    // Jika reply ke user
    if (ctx.message.reply_to_message) {
      targetId = ctx.message.reply_to_message.from.id;
    }

    // Validasi input
    if (!targetId || isNaN(value)) {
      return ctx.reply(
        "💡 Gunakan format:\n" +
        "/addlimit <user_id> <jumlah>\n\n" +
        "Contoh:\n/addlimit 123456789 5\n\nAtau reply pesan user dengan:\n/addlimit 10",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const userId = parseInt(targetId);
    if (isNaN(userId)) {
      return ctx.reply("❌ ID pengguna tidak valid.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === MUAT DATA USER ===
    const user = loadUser(userId);

    // === TAMBAH LIMIT ===
    user.limit += value;
    saveUser(userId, user);

    // === KIRIM HASIL ===
    await ctx.reply(
      `✅ *Berhasil menambah limit user!*\n\n🆔 ID: \`${userId}\`\n💎 Penambahan: +${value}\n📊 Total Limit Sekarang: *${user.limit}*`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di /addlimit:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses /addlimit 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
