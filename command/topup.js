const { loadUser, saveUser } = require("../handler");
const { bot_name } = require("../settings");

module.exports = async (ctx) => {
  try {
    // === Deteksi bahasa otomatis ===
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");

    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const name = ctx.from.first_name || (isIndo ? "Pengguna" : "User");

    const args = ctx.message.text.split(" ").slice(1);
    const rawAmount = args[0];

    // === Validasi input kosong ===
    if (!rawAmount) {
      const helpMsg = isIndo
        ? `
<b>💫 ${bot_name} — Top Up Saldo</b>

Hai <b>${name}</b>!  
Kamu bisa menambah saldo menggunakan <b>Telegram Stars ⭐</b>.

💡 Contoh:
<code>/topup 10000</code> → Tambah saldo Rp10.000  
<code>/topup 50000</code> → Tambah saldo Rp50.000  
<code>/topup 100000</code> → Tambah saldo Rp100.000  

🔹 Nilai 1⭐ = Rp1.000 (harga top-up)
`
        : `
<b>💫 ${bot_name} — Balance Top-Up</b>

Hi <b>${name}</b>!  
You can add balance using <b>Telegram Stars ⭐</b>.

💡 Examples:
<code>/topup 10000</code> → Add Rp10,000 balance  
<code>/topup 50000</code> → Add Rp50,000 balance  
<code>/topup 100000</code> → Add Rp100,000 balance  

🔹 Value 1⭐ = Rp1,000 (top-up rate)
`;

      return ctx.reply(helpMsg, {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === Cegah karakter khusus ===
    if (!/^\d+$/.test(rawAmount)) {
      return ctx.reply(
        isIndo
          ? "❌ Nominal tidak valid!\nGunakan hanya angka tanpa titik, koma, atau huruf.\n\nContoh benar: <code>/topup 10000</code>"
          : "❌ Invalid amount!\nUse only numbers without dots, commas, or letters.\n\nCorrect example: <code>/topup 10000</code>",
        { parse_mode: "HTML", reply_to_message_id: ctx.message?.message_id }
      );
    }

    const amount = parseInt(rawAmount);

    // === Cek nilai minimal & maksimal topup ===
    if (amount < 1000 || amount > 10000000) {
      return ctx.reply(
        isIndo
          ? "⚠️ Nominal top-up harus antara Rp1.000 dan Rp10.000.000."
          : "⚠️ Top-up amount must be between Rp1,000 and Rp10,000,000.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Konversi jumlah topup ke Stars ===
    const starRate = 1000; // 1⭐ = Rp1.000 (biar kamu tidak rugi)
    const stars = Math.ceil(amount / starRate);

    const label = isIndo
      ? `⭐ ${stars} Stars — Top Up Rp${amount.toLocaleString("id-ID")}`
      : `⭐ ${stars} Stars — Top Up Rp${amount.toLocaleString("id-ID")}`;

    // === Kirim invoice Telegram ===
    await ctx.replyWithInvoice({
      title: isIndo
        ? `${bot_name} — Top Up Saldo`
        : `${bot_name} — Balance Top-Up`,
      description: isIndo
        ? `Gunakan Telegram Stars untuk menambah saldo kamu!\n\n💰 Nominal: Rp${amount.toLocaleString(
            "id-ID"
          )}\n⭐ Harga: ${stars} Stars`
        : `Use Telegram Stars to increase your balance!\n\n💰 Amount: Rp${amount.toLocaleString(
            "id-ID"
          )}\n⭐ Price: ${stars} Stars`,
      payload: `topup_${amount}`,
      provider_token: "",
      reply_to_message_id: ctx.message?.message_id,
      currency: "XTR",
      prices: [{ label, amount: stars }],
      photo_url: "https://ik.imagekit.io/srfdvvkga/photo_X6FMtjV6C.jpg",
      photo_width: 640,
      photo_height: 360,
      start_parameter: "topup_balance",
    });
  } catch (err) {
    console.error("❌ Error di /topup:", err);
    await ctx.reply(
      (ctx.isIndo ||
      (ctx.from?.language_code || "").startsWith("id"))
        ? "⚠️ Terjadi kesalahan saat membuka menu top-up saldo."
        : "⚠️ An error occurred while opening the top-up menu.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
