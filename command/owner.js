const fs = require("fs");
const path = require("path");
const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  try {
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");

    const owner = {
      phone_number: "+6287840615800",
      first_name: "Farel",
      last_name: "Alfareza",
      user_id: "VionixDev"
    };

    const contactName = `${owner.first_name} ${owner.last_name}`;
    const messageButton = isIndo ? "💬 Kirim Pesan ke Owner" : "💬 Message the Owner";
    const errorMessage = isIndo
      ? "Terjadi kesalahan saat membuka /owner 😥"
      : "An error occurred while opening /owner 😥";

    await ctx.replyWithContact(owner.phone_number, contactName, {
      vcard: `
BEGIN:VCARD
VERSION:3.0
FN:${owner.first_name} ${owner.last_name}
TEL;TYPE=CELL:${owner.phone_number}
URL:https://t.me/${owner.user_id}
END:VCARD
      `.trim(),
      reply_markup: {
        inline_keyboard: [
          [{ text: messageButton, url: `https://t.me/${owner.user_id}` }]
        ]
      }
    });
  } catch (err) {
    console.error("❌ Error di /owner:", err);
    const msg = (ctx.isIndo || (ctx.from?.language_code || "").startsWith("id"))
      ? "Terjadi kesalahan saat membuka /owner 😥"
      : "An error occurred while opening /owner 😥";
    ctx.reply(msg);
  }
};
