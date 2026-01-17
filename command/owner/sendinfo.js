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
    if (!argsText && !ctx.message.reply_to_message) {
      return ctx.reply(
        "💡 Gunakan format:\n" +
          "/sendinfo <pesan>\n" +
          "atau\n" +
          "/sendinfo <id> | <pesan>\n" +
          "Bisa juga reply ke gambar untuk mengirim gambar + pesan",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    let targetId = null;
    let message = argsText || "";

    // Cek apakah ada "|"
    if (argsText.includes("|")) {
      const split = argsText.split("|").map((s) => s.trim());
      targetId = parseInt(split[0]);
      message = split[1];
      if (isNaN(targetId) || !message) {
        return ctx.reply("❌ Format ID atau pesan tidak valid.", {
          reply_to_message_id: ctx.message?.message_id,
        });
      }
    }

    // === Cek apakah reply ke gambar ===
    let fileId = null;
    if (ctx.message.reply_to_message) {
      const r = ctx.message.reply_to_message;

      // Cek photo
      if (r.photo && r.photo.length > 0) {
        fileId = r.photo.at(-1).file_id;
      }
      // Cek document (image)
      else if (r.document?.mime_type?.startsWith("image/")) {
        fileId = r.document.file_id;
      }
      // Cek media group (geser) → ambil first photo
      else if (r.media_group_id && r.photo?.length > 0) {
        fileId = r.photo.at(-1).file_id;
      }

      // jika tidak ada gambar sama sekali
      if (!fileId && !message) {
        return ctx.reply(
          "❌ Reply harus berisi gambar atau sertakan pesan.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }
    }

    // === Fungsi kirim ke satu user ===
    const sendToUser = async (id) => {
      try {
        if (fileId) {
          await ctx.telegram.sendPhoto(id, fileId, {
            caption: message || undefined,
          });
        } else {
          await ctx.telegram.sendMessage(id, message, { parse_mode: "Markdown" });
        }
        return true;
      } catch (err) {
        console.error(`❌ Gagal kirim ke ${id}:`, err.message);
        return false;
      }
    };

    // === Kirim pesan ===
    if (targetId) {
      const success = await sendToUser(targetId);
      return ctx.reply(
        success
          ? `✅ Pesan berhasil dikirim ke ID: ${targetId}`
          : `❌ Gagal mengirim pesan ke ID: ${targetId}`,
        { reply_to_message_id: ctx.message?.message_id }
      );
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

      for (const id in allUsers) {
        const result = await sendToUser(id);
        if (result) success.push(id);
        else failed.push(id);
      }

      return ctx.reply(
        `✅ Pesan terkirim ke semua user.\n\n✔️ Berhasil: ${success.length}` +
          (success.length > 0 ? `\nID: ${success.join(", ")}` : "") +
          `\n❌ Gagal: ${failed.length}` +
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
