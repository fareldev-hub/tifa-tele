const fs = require("fs");
const path = require("path");
const { owner_id, owner_name } = require("../../settings");

const OWNER_USERNAME = owner_name;
const OWNER_ID = owner_id;

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

    // === Ambil argumen ===
    const argsText = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!argsText) {
      return ctx.reply(
        "💡 Gunakan format:\n" +
          "/sendinfo <pesan>\n" +
          "atau\n" +
          "/sendinfo <id> | <pesan>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    let targetId = null;
    let message = "";

    // Cek apakah ada "|"
    if (argsText.includes("|")) {
      // format: <id> | <pesan>
      const split = argsText.split("|").map((s) => s.trim());
      targetId = parseInt(split[0]);
      message = split[1];
      if (isNaN(targetId) || !message) {
        return ctx.reply("❌ Format ID atau pesan tidak valid.", {
          reply_to_message_id: ctx.message?.message_id,
        });
      }
    } else {
      // tidak ada | → kirim ke semua
      message = argsText;
    }

    // === Kirim pesan ===
    if (targetId) {
      // kirim ke satu user
      try {
        await ctx.telegram.sendMessage(targetId, message, { parse_mode: "Markdown" });
        return ctx.reply(`✅ Pesan berhasil dikirim ke ID: ${targetId}`, {
          reply_to_message_id: ctx.message?.message_id,
        });
      } catch (err) {
        console.error("❌ Gagal kirim pesan ke ID:", targetId, err);
        return ctx.reply(`❌ Gagal mengirim pesan ke ID: ${targetId}`, {
          reply_to_message_id: ctx.message?.message_id,
        });
      }
    } else {
      // kirim ke semua user
      const usersPath = path.join(__dirname, "../../database/users.json");
      if (!fs.existsSync(usersPath)) {
        return ctx.reply("❌ Database user tidak ditemukan.", {
          reply_to_message_id: ctx.message?.message_id,
        });
      }

      const allUsers = JSON.parse(fs.readFileSync(usersPath));
      let success = [];
      let failed = [];

      // Kirim secara berurutan untuk mencegah flood
      for (const id in allUsers) {
        try {
          await ctx.telegram.sendMessage(id, message, { parse_mode: "Markdown" });
          success.push(id);
        } catch (err) {
          failed.push(id);
        }
      }

      return ctx.reply(
        `✅ Pesan terkirim ke semua user.\n\n✔️ Berhasil: ${success.length}\n` +
          (success.length > 0 ? `ID: ${success.join(", ")}\n` : "") +
          `❌ Gagal: ${failed.length}` +
          (failed.length > 0 ? `\nID: ${failed.join(", ")}` : ""),
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  } catch (err) {
    console.error("❌ Error di /sendinfo:", err);
    ctx.reply("❌ Terjadi kesalahan saat memproses /sendinfo 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
