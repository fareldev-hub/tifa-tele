const { loadUser, saveUser } = require("../handler");
const { bot_name } = require("../settings");

module.exports = async (ctx) => {
  try {
    // === Deteksi bahasa ===
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");

    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const name = ctx.from.first_name || (isIndo ? "Pengguna" : "User");

    const args = ctx.message.text.split(" ").slice(1);
    const amount = parseInt(args[0]); // jumlah limit yang ingin dibeli

    // === Validasi input ===
    if (isNaN(amount) || amount <= 0) {
      const helpMsg = isIndo
        ? `
<b>💫 ${bot_name} — Toko Limit</b>

Hai <b>${name}</b>!  
Kamu bisa membeli limit menggunakan saldo kamu.

💡 Contoh:
<code>/buylimit 5</code>
<code>/buylimit 10</code>
<code>/buylimit 50</code>

🔹 1 Limit = Rp1.000  
🔹 Semakin banyak kamu beli, semakin murah!
`
        : `
<b>💫 ${bot_name} — Limit Store</b>

Hi <b>${name}</b>!  
You can buy limits using your balance.

💡 Example:
<code>/buylimit 5</code>
<code>/buylimit 10</code>
<code>/buylimit 50</code>

🔹 1 Limit = Rp1.000  
🔹 The more you buy, the cheaper it gets!
`;

      return ctx.reply(helpMsg, {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // === Hitung harga ===
    let hargaPerLimit = 1000; // base price
    if (amount >= 10 && amount < 25) hargaPerLimit = 900; // 10% diskon
    else if (amount >= 25 && amount < 50) hargaPerLimit = 800; // 20% diskon
    else if (amount >= 50) hargaPerLimit = 700; // 30% diskon

    const totalHarga = amount * hargaPerLimit;

    // === Cek saldo user ===
    if (user.uang < totalHarga) {
      return ctx.reply(
        isIndo
          ? `❌ Saldo kamu tidak cukup! 💰 Harga total: Rp${totalHarga.toLocaleString("id-ID")}\n📉 Saldo kamu: Rp${user.uang.toLocaleString("id-ID")} /topup`
          : `❌ You don't have enough balance! 💰 Total price: Rp${totalHarga.toLocaleString("id-ID")}\n📉 Your balance: Rp${user.uang.toLocaleString("id-ID")} /topup`,
        { parse_mode: "HTML", reply_to_message_id: ctx.message?.message_id }
      );
    }

    // === Kurangi saldo dan tambahkan limit ===
    user.uang -= totalHarga;
    user.limit = (user.limit || 0) + amount;
    saveUser(ctx.from.id, user);

    // === Kirim konfirmasi ke user ===
    await ctx.reply(
      isIndo
        ? `✅ <b>Pembelian Berhasil!</b>\n\n💎 Limit bertambah: <b>+${amount}</b>\n💰 Harga: Rp${totalHarga.toLocaleString("id-ID")}\n📊 Sisa saldo: Rp${user.uang.toLocaleString("id-ID")}`
        : `✅ <b>Purchase Successful!</b>\n\n💎 Limits added: <b>+${amount}</b>\n💰 Price: Rp${totalHarga.toLocaleString("id-ID")}\n📊 Remaining balance: Rp${user.uang.toLocaleString("id-ID")}`,
      { parse_mode: "HTML", reply_to_message_id: ctx.message?.message_id }
    );

    console.log(
      `🛒 ${ctx.from.first_name} membeli ${amount} limit seharga Rp${totalHarga.toLocaleString("id-ID")}`
    );
  } catch (err) {
    console.error("❌ Error di /buylimit:", err);
    await ctx.reply(
      (ctx.isIndo ||
      (ctx.from?.language_code || "").startsWith("id"))
        ? "⚠️ Terjadi kesalahan saat memproses pembelian limit."
        : "⚠️ An error occurred while processing your limit purchase.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
