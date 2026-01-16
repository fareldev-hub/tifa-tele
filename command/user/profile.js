const { loadUser, saveUser } = require("../../handler");
const { makeProfileCard } = require("../../canvas");
const fs = require("fs");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from?.language_code || "en";
    const isIndo = userLang.startsWith("id");

    await ctx.reply(
      isIndo ? "⏳ Memuat data profil..." : "⏳ Loading profile data...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // === Ambil data user ===
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    user.id = ctx.from.id;
    user.name = ctx.from.first_name || "Pengguna";
    user.username = ctx.from.username || "-";
    user.rank = user.rank || "Beginner";
    user.level = user.level || 1;
    user.exp = user.exp || 0;
    user.uang = user.uang || 0;
    user.limit = user.limit || 10;
    user.isPremium = user.isPremium || false;
    saveUser(ctx.from.id, user);

    // === Ambil foto profil Telegram ===
    const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id);
    let photoUrl;
    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      photoUrl = fileLink.href;
    } else {
      photoUrl = "https://i.ibb.co.com/zJ9nQdM/default-avatar.png";
    }

    // === Buat kartu profil dari canvas.js ===
    const imgPath = await makeProfileCard(user, photoUrl);

    // === Tambahkan verifikasi premium ===
    const verify = user.isPremium ? "ꪜ" : "";

    // === Caption profil ===
    const caption = isIndo
      ? `🎮 *Profil* @${user.username} ${verify}
━━━━━━━━━━━━━━━━━━
🆔 *ID:* ${ctx.from.id}
*Nama:* ${user.name} ${verify}
*Level:* ${user.level}
*EXP:* ${user.exp}/400

*Peringkat:* ${user.rank}
*Uang:* Rp${user.uang.toLocaleString()}
*Limit:* ${user.limit}
━━━━━━━━━━━━━━━━━━`
      : `🎮 *Profile* @${user.username} ${verify}
━━━━━━━━━━━━━━━━━━
🆔 *ID:* ${ctx.from.id}
*Name:* ${user.name} ${verify}
*Level:* ${user.level}
*EXP:* ${user.exp}/400

*Rank:* ${user.rank}
*Money:* Rp${user.uang.toLocaleString()}
*Limit:* ${user.limit}
━━━━━━━━━━━━━━━━━━`;

    // === Kirim hasil profil ===
    await ctx.replyWithPhoto(
      { source: imgPath },
      {
        caption,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id,
      }
    );

    // Hapus file lokal hasil render untuk menjaga kebersihan folder
    try {
      fs.unlinkSync(imgPath);
    } catch {
      /* abaikan error jika file sudah terhapus */
    }
  } catch (err) {
    console.error("❌ Error di /profile:", err);
    const msg = (ctx.from?.language_code || "en").startsWith("id")
      ? "⚠️ Terjadi kesalahan saat menampilkan profil 😥"
      : "⚠️ An error occurred while displaying profile 😥";
    await ctx.reply(msg);
  }
};
