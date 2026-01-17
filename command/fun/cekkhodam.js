const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  try {
    let targetUser;

    // Jika reply pesan
    if (ctx.message.reply_to_message) {
      targetUser = ctx.message.reply_to_message.from;
    } else {
      // Jika tag @username
      const args = ctx.message.text.split(" ").slice(1);
      if (!args.length) {
        return ctx.reply(
          "💡 Gunakan format:\n/cekkhodam @username atau reply pesan user",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }

      const username = args[0].replace("@", "");
      const admins = await ctx.getChatAdministrators();
      const member = admins.find((m) => m.user.username === username);
      if (member) targetUser = member.user;
    }

    if (!targetUser) {
      return ctx.reply("❌ User tidak ditemukan. Reply pesan atau tag dengan benar.", {
        reply_to_message_id: ctx.message?.message_id,
      });
    }

    // Ambil data user dari DB
    const userData = loadUser(targetUser.id, targetUser.first_name);

    // Daftar khodam lucu, lawak, keren
    const khodamList = [
      "Macan pemarah", "Buaya sunda", "Beruang sunda", "Harimau birahi", "Tutup odol", "Tutup panci",
      "Kaleng kejepit", "Kanebo kering", "Kapal karam", "Gergaji mesin", "Nyi blorong", "Jin rawa rontek",
      "Kucing Israel", "Capung gila", "Tumis kangkung", "Jam Dinding Rusak", "Gunting Tumpul", "Kasur Empuk",
      "Payung Robek", "Kulkas Kosong", "Piring Pecah", "Meja Berdecit", "Koper Berat", "Topi Melorot",
      "Lem Super Lengket", "Keripik Garing", "Senter Mati", "Kue Kering", "Bantal Empuk", "Kendi Air",
      "Penggaris Melengkung", "Tali Jemuran", "Kancut badak", "Rayap gendut", "Pagar besi", "Kunci gembok",
      "LC karaoke", "Cicak kawin", "Cupang Betina", "Sundel Bolong", "Tuyul Kesandung", "Genderuwo TikTok",
      "Jin Susu Kental Manis", "Si Lontong Lumer", "Setan Payung Bocor", "Jin Es Krim Leleh", "Pocong Bersepeda",
      "Kuntilanak Selfie", "Tuyul Main PS5", "Batu Bata", "Remote TV", "Kompor Meledak", "Helm Nyasar",
      "Gitar Putus Senar", "Si Sate Klathak", "Genderuwo Tertawa", "Jin Penjual Cilok", "Setan Jualan Online",
      "Kuntilanak Kecanduan Kopi", "Pocong Nyanyi Dangdut", "Jin Martabak Telor", "Tuyul Kerja Part-Time",
      "Handuk Basah", "Kipas Rusak", "Jemuran Penuh", "Tisu Gulung", "Gelas Plastik", "Si Bakso Urat",
      "Setan Suka Drama Korea", "Genderuwo Nonton Netflix", "Jin Donat Kentang", "Kuntilanak Pake Kacamata",
      "Pocong Mainan Kucing", "Jin Peminum Boba", "Tuyul Bersepatu Roda", "Si Keripik Pedas", "Setan Kolektor Komik",
      "Genderuwo Pemain Basket", "Jin Sate Madura", "Kuntilanak Nge-Gym", "Pocong Ngantor", "Tuyul Jago Coding",
      "Si Pizza Keju", "Setan Pemilik Cafe", "Genderuwo Seniman", "Jin Coklat Batangan", "Kuntilanak Hobi Makeup",
      "Pocong Main TikTok", "Tuyul Kuliah Online", "Si Rambutan Manis", "Sendal Jepit", "Panci Gosong",
      "Guling Gembung", "Sarung Bantal", "Kaos Oblong", "Jin Kipas Angin", "Setan Pembeli Pulsa", "Kuntilanak Karaoke",
      "Pocong Joget", "Ember Bocor", "Celana Sobek", "Sepeda Tua", "Telepon Jadul", "Tas Plastik", "Kalender Bekas",
      "Pensil Inul", "Buku Kusut", "Korek Macet", "Mangkok Retak", "Lemari Penuh"
    ];

    // Jika belum ada khodam → kasih random dari list
    if (!userData.khodam || !userData.khodam.name || userData.khodam.name === "Belum punya khodam") {
      const randomKhodam = khodamList[Math.floor(Math.random() * khodamList.length)];
      userData.khodam = {
        name: randomKhodam,
        power: Math.floor(Math.random() * 100) + 1 // power acak 1–100
      };
      saveUser(targetUser.id, userData);
    }

    const khodam = userData.khodam;

    // Kirim balasan
    await ctx.reply(
      `👤 Khodam milik *${targetUser.first_name}*:\n\n` +
      `🪄 Nama: ${khodam.name}\n` +
      `⚡ Power: ${khodam.power}`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
    );

  } catch (err) {
    console.error("❌ Error di /cekkhodam:", err);
    ctx.reply("❌ Terjadi kesalahan saat mengecek khodam 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
