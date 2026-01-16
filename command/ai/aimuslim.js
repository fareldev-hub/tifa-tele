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
        ? "💡 Gunakan format: /aimuslim <pertanyaan kamu>\nContoh: `/aimuslim siapa presiden indonesia?`"
        : "💡 Use format: /aimuslim <your question>\nExample: `/aimuslim who is the president of Indonesia?`";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id, parse_mode: "Markdown" });
    }

    // Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // Pesan awal loading
    const loadingMessage = await ctx.reply(isIndo ? "💭 Sedang berpikir..." : "💭 Thinking...", {
      reply_to_message_id: ctx.message?.message_id,
    });

    // 🔁 Animasi titik-titik berpikir
    const loadingStates = ["💭", "💭.", "💭..", "💭..."];
    let i = 0;
    const interval = setInterval(() => {
      ctx.telegram
        .editMessageText(
          ctx.chat.id,
          loadingMessage.message_id,
          undefined,
          `${isIndo ? "Sedang berpikir" : "Thinking"}${loadingStates[i++ % loadingStates.length]}`
        )
        .catch(() => {});
    }, 900);

    // 🔗 Panggil API Copilot
    const apiUrl = `https://zellapi.autos/ai/alquran?text=${encodeURIComponent(input)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || !data.status || !data.result?.answer) {
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

    // Hentikan animasi loading
    clearInterval(interval);

    // Olah teks agar aman untuk MarkdownV2
    let aiText = data.result.answer.toString();

    aiText = aiText
      .split(/(```[\s\S]*?```)/g)
      .map((part) => (part.startsWith("```") ? part : escapeMarkdownV2(part)))
      .join("");

    const messageMarkdown = `\n${aiText}\n`;

    // 🚀 Edit pesan loading menjadi hasil akhir
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
    console.error("❌ Error di /aimuslim:", err);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message.message_id + 1,
        undefined,
        (ctx.from?.language_code || "").startsWith("id")
          ? "⚠️ Terjadi kesalahan saat memproses permintaan 😥"
          : "⚠️ Error occurred while processing your request 😥"
      );
    } catch {
      ctx.reply(
        (ctx.from?.language_code || "").startsWith("id")
          ? "⚠️ Terjadi kesalahan saat memproses permintaan 😥"
          : "⚠️ Error occurred while processing your request 😥",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }
  }
};
