const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

// 🧩 Fungsi untuk melindungi karakter MarkdownV2 Telegram
function escapeMarkdownV2(text) {
  if (!text) return "";
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

module.exports = async (ctx) => {
  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    // 🔒 Cek limit pengguna
    if (user.limit <= 0) {
      const msg = isIndo
        ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
        : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }

    // 💬 Ambil pertanyaan
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      const msg = isIndo
        ? "💡 Gunakan format: /copilot <pertanyaan kamu>\nContoh: `/copilot siapa presiden indonesia?`"
        : "💡 Use format: /copilot <your question>\nExample: `/copilot who is the president of Indonesia?`";
      return ctx.reply(msg, {
        reply_to_message_id: ctx.message?.message_id,
        parse_mode: "Markdown",
      });
    }

    // Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 💭 Pesan awal
    const loadingMessage = await ctx.reply(isIndo ? "💭 Sedang berpikir..." : "💭 Thinking...", {
      reply_to_message_id: ctx.message?.message_id,
    });

    // 🔁 Animasi loading dots
    const dots = ["💭", "💭.", "💭..", "💭..."];
    let i = 0;
    const interval = setInterval(() => {
      ctx.telegram
        .editMessageText(
          ctx.chat.id,
          loadingMessage.message_id,
          undefined,
          `${isIndo ? "Sedang berpikir" : "Thinking"}${dots[i++ % dots.length]}`
        )
        .catch(() => {});
    }, 800);

    // 🔗 Panggil API Copilot
    const apiUrl = `https://api.deline.web.id/ai/copilot?text=${encodeURIComponent(input)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || !data.status || !data.result) {
      clearInterval(interval);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMessage.message_id,
        undefined,
        isIndo
          ? "⚠️ Gagal mendapatkan respons dari AI 😥"
          : "⚠️ Failed to get a response from AI 😥"
      );
      return;
    }

    clearInterval(interval);

    // Olah teks agar aman untuk MarkdownV2
    let aiText = data.result.toString();

    aiText = aiText
      .split(/(```[\s\S]*?```)/g)
      .map((part) => (part.startsWith("```") ? part : escapeMarkdownV2(part)))
      .join("");

    const messageMarkdown = `\n${aiText}\n`;

    // 🚀 Edit pesan menjadi hasil akhir
    await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, messageMarkdown, {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: isIndo ? "🔁 Teruskan" : "🔁 Forward",
              switch_inline_query: aiText.slice(0, 300),
            },
          ],
        ],
      },
    });
  } catch (err) {
    console.error("❌ Error di /copilot:", err);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message.message_id + 1,
        undefined,
        (ctx.from?.language_code || "").startsWith("id")
          ? "⚠️ Terjadi kesalahan saat memproses copilot 😥"
          : "⚠️ Error occurred while processing copilot 😥"
      );
    } catch {
      ctx.reply(
        (ctx.from?.language_code || "").startsWith("id")
          ? "⚠️ Terjadi kesalahan saat memproses copilot 😥"
          : "⚠️ Error occurred while processing copilot 😥",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  }
};
