const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  const isIndo = (ctx.from?.language_code || "").startsWith("id");

  // Helper reply yang AMAN
  const safeReply = async (text, extra = {}) => {
    try {
      const opts = { ...extra };

      // Support supergroup topics
      if (ctx.message?.message_thread_id) {
        opts.message_thread_id = ctx.message.message_thread_id;
      }

      return await ctx.reply(text, opts);
    } catch (e) {
      console.error("❌ safeReply error:", e.message);
      return null;
    }
  };

  try {
    // Pastikan command dari message
    if (!ctx.message?.text) return;

    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0) {
      return safeReply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset."
      );
    }

    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    const replyMsg = ctx.message.reply_to_message;

    if (!input && !replyMsg) {
      return safeReply(
        isIndo
          ? "💬 Gunakan format:\n/ai <pesan>\natau balas pesan dengan /ai"
          : "💬 Use format:\n/ai <message>\nor reply to a message with /ai"
      );
    }

    // Kurangi limit
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // Thinking message (TANPA reply_to_message_id)
    const thinkingMsg = await safeReply(
      isIndo ? "💭 Sedang berpikir..." : "💭 Thinking..."
    );

    if (!thinkingMsg?.message_id) return;

    // Animasi loading
    const dots = ["", ".", "..", "..."];
    let i = 0;

    const interval = setInterval(() => {
      ctx.telegram
        .editMessageText(
          ctx.chat.id,
          thinkingMsg.message_id,
          ctx.message?.message_thread_id,
          `${isIndo ? "💭 Sedang berpikir" : "💭 Thinking"}${dots[i++ % dots.length]}`
        )
        .catch(() => {});
    }, 900);

    // Bangun prompt
    let promptText = "";

    if (replyMsg?.text) {
      promptText =
        `Pesan sebelumnya:\n"${replyMsg.text}"\n\n` +
        `Balasan pengguna:\n"${input || "(tidak ada teks tambahan)"}"`;
    } else if (replyMsg?.photo) {
      promptText = input || "Tolong jelaskan gambar tersebut.";
    } else {
      promptText = input;
    }

    // Call AI endpoint
    const url = `https://endpoint-hub.up.railway.app/api/chatai/tifa?text=${encodeURIComponent(
      promptText
    )}`;

    const res = await fetch(url, { timeout: 60_000 });
    const json = await res.json();

    clearInterval(interval);

    const aiText =
      json?.response ||
      (isIndo ? "Aku bingung jawabnya 😅" : "I'm not sure 😅");

    // Edit thinking → jawaban
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinkingMsg.message_id,
      ctx.message?.message_thread_id,
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

    safeReply(
      isIndo
        ? "⚠️ Terjadi kesalahan saat memproses /ai 😥"
        : "⚠️ An error occurred while processing /ai 😥"
    );
  }
};
