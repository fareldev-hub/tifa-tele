const fs = require("fs");
const path = require("path");
const { Markup } = require("telegraf");
const { bot_name } = require("../../settings");

module.exports = async (ctx) => {
  try {
    // ✅ Path absolut agar tidak error di subfolder mana pun
    const imagePath = path.resolve(__dirname, "../../assets/image/welcome.jpg");

    // Cek apakah file gambar tersedia
    if (!fs.existsSync(imagePath)) {
      console.warn("⚠️ File gambar tidak ditemukan, menggunakan fallback URL.");
    }

    // 🌐 Deteksi bahasa pengguna
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    // 🗣️ Pesan bilingual
    const message = isIndo
      ? `
*✨ Tentang ${bot_name} ✨*
━━━━━━━━━━━━━━━━━━
*💰 DONASI*
Dukung pengembangan bot ini dengan donasi!

📱 *Dana:* 6287840615800  
💳 *Saweria:* [Klik di sini](https://saweria.co/fareldeveloper)

Setiap donasi sangat berarti untuk:
• Server hosting  
• Pengembangan fitur baru  
• Maintenance bot  

Terima kasih atas dukungannya! 🙏

━━━━━━━━━━━━━━━━━━`
      : `
*✨ About ${bot_name} ✨*
━━━━━━━━━━━━━━━━━━
*💰 DONATION*
Support the development of this bot with a donation!

📱 *Dana (Indonesia only):* 6287840615800  
💳 *Saweria:* [Click here](https://saweria.co/fareldeveloper)

Every donation helps keep this bot running by funding:
• Server hosting  
• New feature development  
• Bot maintenance  

Thank you very much for your support! 🙏

━━━━━━━━━━━━━━━━━━`;

    // 🔘 Tombol bilingual
    const backText = isIndo ? "⬅️ Kembali" : "⬅️ Back";

    // 🖼️ Kirim gambar (fallback jika file tidak ada)
    if (fs.existsSync(imagePath)) {
      await ctx.replyWithPhoto(
        { source: imagePath },
        {
          caption: message,
          parse_mode: "Markdown",
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback(backText, "about")]
          ]),
          reply_to_message_id: ctx.message?.message_id
        }
      );
    } else {
      // Jika file gambar tidak ditemukan, kirim teks saja
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(backText, "about")]
        ]),
        reply_to_message_id: ctx.message?.message_id
      });
    }

  } catch (err) {
    console.error("❌ Error di /donasi:", err);
    const msg = (ctx.from?.language_code || "").startsWith("id")
      ? "⚠️ Terjadi kesalahan saat membuka /donasi 😥"
      : "⚠️ An error occurred while opening /donate 😥";
    await ctx.reply(msg);
  }
};