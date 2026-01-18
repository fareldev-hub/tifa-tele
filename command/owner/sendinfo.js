const fs = require("fs");
const path = require("path");
const { owner_id, owner_name } = require("../../settings");

const OWNER_USERNAME = owner_name;
const OWNER_ID = owner_id;

const USERS_DB = path.join(__dirname, "../../database/users.json");

const delay = (ms) => new Promise(res => setTimeout(res, ms));

module.exports = async (ctx) => {
  try {
    if (!ctx.from) return;

    // === CEK OWNER ===
    const isOwner =
      ctx.from.id === OWNER_ID ||
      (ctx.from.username && ctx.from.username === OWNER_USERNAME);

    if (!isOwner) {
      return ctx.reply("🚫 Kamu tidak punya izin menggunakan perintah ini!");
    }

    // === AMBIL PESAN ===
    const text =
      ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!text && !ctx.message.reply_to_message) {
      return ctx.reply(
        "💡 Gunakan:\n" +
        "/sendinfo <pesan>\n" +
        "atau reply ke gambar lalu /sendinfo <pesan>"
      );
    }

    // === AMBIL GAMBAR JIKA REPLY ===
    let fileId = null;
    if (ctx.message.reply_to_message) {
      const r = ctx.message.reply_to_message;
      if (r.photo?.length) fileId = r.photo.at(-1).file_id;
      else if (r.document?.mime_type?.startsWith("image/"))
        fileId = r.document.file_id;
    }

    if (!fs.existsSync(USERS_DB)) {
      return ctx.reply("❌ Database user tidak ditemukan.");
    }

    const users = Object.keys(JSON.parse(fs.readFileSync(USERS_DB)));

    let success = 0;
    let failed = 0;
    let blocked = 0;

    await ctx.reply(`📢 Broadcast dimulai ke ${users.length} user...`);

    for (const id of users) {
      try {
        if (fileId) {
          await ctx.telegram.sendPhoto(id, fileId, {
            caption: text || undefined,
            parse_mode: "HTML"
          });
        } else {
          await ctx.telegram.sendMessage(id, text, {
            parse_mode: "HTML"
          });
        }
        success++;
      } catch (err) {
        const code = err?.response?.error_code;

        if (code === 403) {
          // user block bot
          blocked++;
        } else if (code === 429) {
          // flood wait
          const wait =
            err.response.parameters?.retry_after || 3;
          await delay(wait * 1000);
          continue;
        } else {
          failed++;
        }
      }

      // 🚦 throttle (AMAN)
      await delay(40); // ±25 msg/detik
    }

    await ctx.reply(
      `📊 Broadcast selesai\n\n` +
      `✅ Berhasil: ${success}\n` +
      `🚫 Blocked: ${blocked}\n` +
      `❌ Gagal: ${failed}`
    );

  } catch (err) {
    console.error("❌ Error /sendinfo:", err);
    ctx.reply("❌ Terjadi kesalahan saat broadcast.");
  }
};
