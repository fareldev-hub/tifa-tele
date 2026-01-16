const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { bot_name } = require("../../settings");

module.exports = async (ctx) => {
  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    const replyMsg = ctx.message.reply_to_message;

    if (!input && !replyMsg) {
      return ctx.reply(
        isIndo
          ? "💬 Gunakan format: /ai <pesan> atau balas pesan dengan /ai <teks>"
          : "💬 Use format: /ai <message> or reply to a message with /ai <text>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Kurangi limit
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // Thinking message
    const thinkingMsg = await ctx.reply(
      isIndo ? "💭 Sedang berpikir..." : "💭 Thinking...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Loading animation
    const states = ["", ".", "..", "..."];
    let i = 0;
    const interval = setInterval(() => {
      ctx.telegram.editMessageText(
        ctx.chat.id,
        thinkingMsg.message_id,
        undefined,
        `${isIndo ? "💭 Sedang berpikir" : "💭 Thinking"}${states[i++ % states.length]}`
      ).catch(() => {});
    }, 900);

    // Gabungkan konteks teks
    let promptText = "";

    if (replyMsg?.text) {
      promptText = `Pesan sebelumnya: "${replyMsg.text}"\nBalasan pengguna: "${input || "(tidak ada teks tambahan)"}"`;
    } else if (replyMsg?.photo) {
      promptText = input || "Tolong jelaskan gambar tersebut.";
    } else {
      promptText = input;
    }

    // Call endpoint tifa
    const url = `https://endpoint-hub.up.railway.app/api/chatai/tifa?text=${encodeURIComponent(promptText)}`;
    const res = await fetch(url);
    const json = await res.json();

    clearInterval(interval);

    const aiText =
      json?.response ||
      (isIndo ? "Aku bingung jawabnya 😅" : "I'm not sure 😅");

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinkingMsg.message_id,
      undefined,
      aiText,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: isIndo ? "Teruskan" : "Forward",
                switch_inline_query: aiText.slice(0, 300),
              },
            ],
          ],
        },
      }
    );
  } catch (err) {
    console.error("❌ Error di /ai:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "⚠️ Terjadi kesalahan saat memproses /ai 😥"
        : "⚠️ An error occurred while processing /ai 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
