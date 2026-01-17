const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    // Pastikan command hanya di grup
    if (!ctx.chat || ctx.chat.type === "private") {
      return ctx.reply("❌ Perintah /cekkhodam hanya bisa digunakan di grup!");
    }

    let targetUser;

    // Jika reply pesan
    if (ctx.message.reply_to_message) {
      targetUser = ctx.message.reply_to_message.from;
    } else {
      // Jika tag @username
      const args = ctx.message.text.split(" ").slice(1);
      if (!args.length) {
        return ctx.reply(
          "💡 Gunakan format:\n/cekkhodam @username atau reply pesan user",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }

      const username = args[0].replace("@", "");
      // Ambil semua admin
      const admins = await ctx.getChatAdministrators();
      const member = admins.find(m => m.user.username === username);
      if (member) targetUser = member.user;
    }

    if (!targetUser) {
      return ctx.reply("❌ User tidak ditemukan. Reply pesan atau tag dengan benar.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // Ambil data user dari DB
    const userData = loadUser(targetUser.id, targetUser.first_name);

    // Daftar khodam acak lucu, lawak, keren
    const khodamList = [
      { name: "Maling Pangsit", power: Math.floor(Math.random() * 10) + 1 },
      { name: "Naga", power: Math.floor(Math.random() * 20) + 5 },
      { name: "Mak Lampir", power: Math.floor(Math.random() * 15) + 1 },
      { name: "Kadal", power: Math.floor(Math.random() * 25) + 10 },
      { name: "Buaya Darat", power: Math.floor(Math.random() * 30) + 20 },
      { name: "Si Keripik Pedas", power: Math.floor(Math.random() * 20) + 5 },
      { name: "Buaya sunda", power: Math.floor(Math.random() * 15) + 1 },
      { name: "Superhero Tidur", power: Math.floor(Math.random() * 40) + 25 },
      { name: "Monyet Hacker", power: Math.floor(Math.random() * 20) + 10 },
      { name: "Raja Sate", power: Math.floor(Math.random() * 10) + 1 }
    ];

    // Jika belum ada khodam → kasih random
    if (!userData.khodam || !userData.khodam.name || userData.khodam.name === "Belum punya khodam") {
      const randomKhodam = khodamList[Math.floor(Math.random() * khodamList.length)];
      userData.khodam = randomKhodam;
      saveUser(targetUser.id, userData);
    }

    const khodam = userData.khodam;

    // Kirim balasan
    await ctx.reply(
      `👤 Khodam milik *${targetUser.first_name}*:\n\n` +
      `🪄 Nama: ${khodam.name}\n` +
      `⚡ Power: ${khodam.power}`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di /cekkhodam:", err);
    ctx.reply("❌ Terjadi kesalahan saat mengecek khodam 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
