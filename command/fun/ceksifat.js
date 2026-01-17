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
                    "💡 Gunakan format:\n/ceksifat @username atau reply pesan user",
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

        // List sifat lucu, gokil, keren
        const sifatList = [
            "Pemalas tapi kreatif",
            "Suka drama tapi jago coding",
            "Pintar tapi pelupa",
            "Suka makan tapi diet terus",
            "Cerewet tapi baik hati",
            "Pemalu tapi pemberani",
            "Suka tidur siang",
            "Selalu telat tapi santai",
            "Riang tapi pemikir",
            "Suka ngelawak",
            "Jago masak tapi lupa beli bahan",
            "Cerdas tapi nyentrik",
            "Santuy tapi rajin",
            "Suka tantangan",
            "Setia kawan",
            "Bucin sejati",
            "Galak tapi sayang teman",
            "Suka ngegame",
            "Kocak tapi misterius",
            "Jago debat tapi pelupa",
            "Pembenci"
        ];

        // Jika belum punya sifat → kasih random dari list
        if (!userData.sifat) {
            const randomSifat = sifatList[Math.floor(Math.random() * sifatList.length)];
            userData.sifat = randomSifat;
            saveUser(targetUser.id, userData);
        }

        const sifat = userData.sifat;

        // Kirim balasan
        await ctx.reply(
            `👤 Sifat milik *${targetUser.first_name}*:\n\n` +
            `✨ ${sifat}`,
            { parse_mode: "Markdown", reply_to_message_id: ctx.message?.message_id }
        );

    } catch (err) {
        console.error("❌ Error di /ceksifat:", err);
        ctx.reply("❌ Terjadi kesalahan saat mengecek sifat 😥", {
            reply_to_message_id: ctx.message?.message_id,
        });
    }
};
