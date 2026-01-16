const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");

// Fungsi untuk escape karakter berbahaya di Markdown
function escapeMarkdown(text = "") {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // 🔒 Cek uang
    let price = "10000"
    if (user.uang <= price) {
      return ctx.reply(
        isIndo
          ? `🚫 Saldo kamu tidak cukup ini membutuhkan Rp${price} uang. silahkan /topup untuk menambah uang kamu.`
          : `🚫 Your balance is insufficient, this requires Rp${price}. Please top up to add more money.`,
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 📥 Ambil argumen
    const args = ctx.message.text.split(" ").slice(1);
    const url = args[0];
    const message = args.slice(1).join(" ") || "Halo dari bot 😎";

    if (!url) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format:\n/spamngl <url_ngl> [pesan]\nContoh:\n/spamngl https://ngl.link/fa#### Coba tebak"
          : "💡 Use format:\n/spamngl <ngl_url> [message]\nExample:\n/spamngl https://ngl.link/username Guess what",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // ⏳ Pesan loading
    const waitMsg = await ctx.reply(
      isIndo
        ? "📨 Mengirim pesan spam ke akun NGL..."
        : "📨 Sending spam messages to NGL account...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔗 Panggil API
    const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(
      url
    )}&message=${encodeURIComponent(message)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log("📜 API Response:", data);

    if (!data?.status || !data?.result) {
      throw new Error("⚠️ Respon API tidak valid.");
    }

    const {
      username_target,
      pesan_terkirim,
      total_percobaan,
      berhasil_dikirim,
      gagal_dikirim,
    } = data.result;

    // ✨ Buat teks hasil dengan escape karakter
    const replyText = isIndo
      ? `✅ *Spam NGL Berhasil!*\n\n👤 *Target:* ${escapeMarkdown(username_target)}\n💬 *Pesan:* ${escapeMarkdown(
          pesan_terkirim
        )}\n📨 *Percobaan:* ${total_percobaan}\n✅ *Berhasil:* ${berhasil_dikirim}\n❌ *Gagal:* ${gagal_dikirim}\n💎 *Harga :* -Rp${price}`
      : `✅ *NGL Spam Sent!*\n\n👤 *Target:* ${escapeMarkdown(username_target)}\n💬 *Message:* ${escapeMarkdown(
          pesan_terkirim
        )}\n📨 *Attempts:* ${total_percobaan}\n✅ *Success:* ${berhasil_dikirim}\n❌ *Failed:* ${gagal_dikirim}\n💎 *Price:* -Rp${price}`;

    await ctx.replyWithMarkdown(replyText, {
      reply_to_message_id: ctx.message?.message_id,
    });
    user.uang -= price;
    saveUser(ctx.from.id, user);

  } catch (err) {
    console.error("❌ Error di /spamngl:", err);
    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Terjadi kesalahan saat mengirim pesan ke NGL 😥"
        : "❌ An error occurred while sending NGL spam 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
