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

    // Ambil target user ID
    let args = ctx.message.text.split(" ").slice(1);
    let targetId = args[0];

    // Jika command digunakan reply
    if (ctx.message.reply_to_message) {
      targetId = ctx.message.reply_to_message.from.id;
    }

    if (!targetId) {
      return ctx.reply(
        "💡 Gunakan format:\n/deluser <user_id>\n\nAtau reply pesan user yang ingin dihapus dari database.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const userId = parseInt(targetId);
    if (isNaN(userId)) {
      return ctx.reply("❌ ID pengguna tidak valid.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === Muat database & hapus user ===
    const dbPath = require("path").join(__dirname, "../../database/users.json");
    const fs = require("fs");
    if (!fs.existsSync(dbPath)) {
      return ctx.reply("❌ Database tidak ditemukan.", { reply_to_message_id: ctx.message?.message_id });
    }

    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    if (!db[userId]) {
      return ctx.reply(`❌ User dengan ID \`${userId}\` tidak ditemukan di database.`, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id
      });
    }

    delete db[userId];
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    await ctx.reply(
      `✅ User dengan ID \`${userId}\` berhasil dihapus dari database.`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di /deluser:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses /deluser 😥", { reply_to_message_id: ctx.message?.message_id });
  }
};
