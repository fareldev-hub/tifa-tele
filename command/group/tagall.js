module.exports = async (ctx) => {
  try {
    const chatId = ctx.chat.id;

    // Hanya grup
    if (!ctx.chat || ctx.chat.type === "private") {
      return ctx.reply("❌ Perintah /tagall hanya bisa digunakan di grup!");
    }

    // Ambil pesan custom
    const args = ctx.message.text.split(" ").slice(1);
    let customMsg = args.join(" ").trim();

    // Jika tidak ada pesan custom, kasih default text agar Telegram tidak error
    if (!customMsg) customMsg = "👥 Tag semua anggota: Haloooo Semuanyaa";

    // pastikan global.groupMembers ada
    global.groupMembers = global.groupMembers || {};
    global.groupMembers[chatId] = global.groupMembers[chatId] || [];

    // Ambil semua admin
    const admins = await ctx.getChatAdministrators();
    const adminMentions = admins.map((a) => a.user.id);

    // Gabungkan admin + member unik
    const memberIds = [
      ...new Set([
        ...adminMentions,
        ...global.groupMembers[chatId].map((u) => u.id),
      ]),
    ];

    if (memberIds.length === 0) {
      return ctx.reply("❌ Tidak ada anggota yang bisa ditag.");
    }

    // Kirim per chunk (batasi 50 mention per pesan)
    const chunkSize = 50;
    for (let i = 0; i < memberIds.length; i += chunkSize) {
      const chunkMentions = memberIds
        .slice(i, i + chunkSize)
        .map((id) => `<a href="tg://user?id=${id}">⠀</a>`)
        .join(" ");

      const msg = `${customMsg}\n${chunkMentions}`; // pastikan ada teks sebelum mention

      await ctx.reply(msg, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    }
  } catch (err) {
    console.error("❌ Error di /tagall:", err);
    ctx.reply("❌ Terjadi kesalahan saat menjalankan /tagall.");
  }
};
