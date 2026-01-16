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

    // === AMBIL TARGET USER ===
    const args = ctx.message.text.split(" ").slice(1);
    let targetId = args[0];

    // Jika command digunakan dengan reply
    if (ctx.message.reply_to_message) {
      targetId = ctx.message.reply_to_message.from.id;
    }

    if (!targetId) {
      return ctx.reply("💡 Gunakan format:\n/band <user_id>\n\nAtau reply pesan user yang ingin diban.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    const userId = parseInt(targetId);
    if (isNaN(userId)) {
      return ctx.reply("❌ ID pengguna tidak valid.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === UPDATE STATUS USER ===
    const user = loadUser(userId);
    user.isBanned = true;
    saveUser(userId, user);

    await ctx.reply(
      `🚫 *User berhasil dibanned!*\n\n🆔 ID: \`${userId}\`\n📛 Status: *Banned*`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );
  } catch (err) {
    console.error("❌ Error di /band:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses /band 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
