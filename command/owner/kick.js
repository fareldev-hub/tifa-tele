const { Markup } = require("telegraf");

const { bot_name, owner_id, owner_name } = require("../../settings");

const OWNER_USERNAME = owner_name
const OWNER_ID = owner_id


module.exports = async (ctx) => {
  try {
    const sender = ctx.from;

    // === CEK: hanya bisa di grup ===
    if (!ctx.chat || ctx.chat.type === "private") {
      return ctx.reply("⚠️ Perintah ini hanya bisa digunakan di dalam grup.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === CEK: hanya admin & owner ===
    const isOwner =
      sender.username === OWNER_USERNAME ||
      sender.id === OWNER_ID;

    const memberInfo = await ctx.telegram.getChatMember(ctx.chat.id, sender.id);
    const isAdmin =
      ["administrator", "creator"].includes(memberInfo.status) || isOwner;

    if (!isAdmin) {
      return ctx.reply("🚫 Kamu bukan admin atau owner, jadi tidak bisa menggunakan perintah ini!", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === AMBIL TARGET ID ===
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length < 1) {
      return ctx.reply("💡 Gunakan format:\n/kick <user_id>\n\nContoh:\n/kick 123456789", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    const userId = parseInt(args[0]);
    if (isNaN(userId)) {
      return ctx.reply("❌ ID pengguna tidak valid. Harus berupa angka.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === CEK: jangan keluarkan bot sendiri ===
    if (userId === ctx.botInfo.id) {
      return ctx.reply("😅 Aku tidak bisa mengeluarkan diriku sendiri.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === KICK ===
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);

    await ctx.reply(
      `✅ *Berhasil mengeluarkan pengguna dari grup!*\n\n🆔 ID: \`${userId}\`\n👮‍♂️ Admin: *${sender.first_name}*`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );

    // === LOG KE TERMINAL ===
    const time = new Date().toLocaleString("id-ID", { hour12: false });
    console.log("\x1b[90m\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
    console.log(`\x1b[44m🕒 ${time}\x1b[0m`);
    console.log(`👥 Grup     : ${ctx.chat.title}`);
    console.log(`👤 Admin    : ${sender.first_name} (${sender.id})`);
    console.log(`🚫 Kick ID  : ${userId}`);
    console.log("\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\x1b[0m");

  } catch (err) {
    console.error("❌ Error di /kick:", err);
    ctx.reply(
      "❌ Terjadi kesalahan saat mencoba mengeluarkan pengguna.\nPastikan bot memiliki hak admin untuk mengeluarkan anggota.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
