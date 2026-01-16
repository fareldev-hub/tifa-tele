
function escapeMarkdownV2(text) {
  if (!text) return "";
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

module.exports = async (ctx) => {
  try {
    // 📦 Ambil data user dan bahasa
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");

    // 🔒 Cek limit harian user
    if (user.limit <= 0) {
      const msg = isIndo
        ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
        : "🚫 Your daily limit has run out. Please wait 24 hours for reset.";
      return ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }

    // 💬 Ambil input pengguna
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      const msg = isIndo
        ? "💬 Gunakan format: /gpt <pertanyaan kamu>\nContoh: `/gpt siapa presiden indonesia?`"
        : "💬 Use format: /gpt <your question>\nExample: `/gpt who is the president of Indonesia?`";
      return ctx.reply(msg, {
        reply_to_message_id: ctx.message?.message_id,
        parse_mode: "Markdown",
      });
    }

    // 🔋 Kurangi limit user dan simpan
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 💭 Kirim pesan loading (akan diedit nanti)
    const loadingMessage = await ctx.reply(isIndo ? "Sedang berpikir..." : "Thinking...", {
      reply_to_message_id: ctx.message?.message_id,
    });

    // 🧠 Logika dasar AI
    const logic_ai = `
Nama kamu adalah ChatGpt, sebuah bot Telegram yang membantu pengguna dengan berbagai fitur.
Kamu dikembangkan oleh tim OpenAI dan pembuat ${bot_name}, sebuah bot multi-fungsi Telegram, adalah Farel Alfareza.
Kamu harus menjawab dengan sopan, jelas, dan informatif.
Jika bahasa pengguna bukan Bahasa Indonesia, jawab dalam bahasa Inggris.
`;

    // 🌐 Panggil API GPT
    const apiUrl = `https://api.siputzx.my.id/api/gpt/gpt3?prompt=${encodeURIComponent(
      logic_ai
    )}&content=${encodeURIComponent(input)}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    // ⚠️ Cek respons API
    if (!data || !data.status || !data.data) {
      const msg = isIndo
        ? "⚠️ Gagal mendapatkan respons dari AI 😥"
        : "⚠️ Failed to get a response from AI 😥";
      return ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, null, msg);
    }

    // 🧹 Escape teks agar aman untuk MarkdownV2
    let aiText = data.data.toString();
    aiText = aiText.replace(/```(?:\w+)?\n([\s\S]*?)```/g, (match, p1) => {
      return "```\n" + escapeMarkdownV2(p1) + "\n```";
    });
    aiText = aiText
      .split(/(```[\s\S]*?```)/g)
      .map((part) => (part.startsWith("```") ? part : escapeMarkdownV2(part)))
      .join("");

    // 🚀 Edit pesan menjadi hasil akhir
    await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, null, aiText, {
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
    console.error("❌ Error di /gpt:", err);

    const msg = (ctx.isIndo || (ctx.from?.language_code || "").startsWith("id"))
      ? "❌ Terjadi kesalahan saat memproses /gpt 😥"
      : "❌ An error occurred while processing /gpt 😥";

    // Coba edit pesan jika masih loading, kalau gagal baru reply baru
    try {
      await ctx.telegram.editMessageText(ctx.chat.id, ctx.message.message_id + 1, null, msg);
    } catch {
      await ctx.reply(msg, { reply_to_message_id: ctx.message?.message_id });
    }
  }
};
