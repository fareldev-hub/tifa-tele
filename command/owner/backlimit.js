const fs = require("fs");
const path = require("path");
const { owner_id, owner_name } = require("../../settings");

const OWNER_USERNAME = owner_name;
const OWNER_ID = owner_id;
const DEFAULT_LIMIT = 20; // batas default

module.exports = async (ctx) => {
  try {
    const sender = ctx.from;

    // === CEK OWNER ===
    const isOwner =
      sender.username === OWNER_USERNAME || sender.id === OWNER_ID;

    if (!isOwner) {
      return ctx.reply("🚫 Kamu tidak punya izin menggunakan perintah ini!", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    const usersPath = path.join(__dirname, "../../database/users.json");
    if (!fs.existsSync(usersPath)) {
      return ctx.reply("❌ Database user tidak ditemukan.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    const allUsers = JSON.parse(fs.readFileSync(usersPath));
    let count = 0;

    for (const id in allUsers) {
      allUsers[id].limit = DEFAULT_LIMIT;
      count++;
    }

    fs.writeFileSync(usersPath, JSON.stringify(allUsers, null, 2));

    return ctx.reply(
      `✅ Limit semua pengguna berhasil dikembalikan ke default (${DEFAULT_LIMIT}).\n👤 Total pengguna: ${count}`,
      { reply_to_message_id: ctx.message?.message_id }
    );
  } catch (err) {
    console.error("❌ Error di /limitbackup:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses /limitbackup 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
