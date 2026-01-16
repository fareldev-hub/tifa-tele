const fs = require("fs");
const path = require("path");

const { 
  bot_name
} = require("../settings");
module.exports = async (ctx) => {
  try {
    
    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");
    const dbPath = path.join(__dirname, "../database/users.json");
    const imagePath = path.join(__dirname, "../assets/image/welcome.jpg");

    if (!fs.existsSync(dbPath)) {
      return ctx.reply(
        isIndo
          ? "⚠️ Database pengguna belum tersedia."
          : "⚠️ User database is not available yet."
      );
    }

    const db = JSON.parse(fs.readFileSync(dbPath));
    const users = Object.values(db);

    if (users.length === 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Belum ada data pengguna yang tersimpan."
          : "🚫 No user data saved yet."
      );
    }

    users.sort((a, b) => {
      if (b.level === a.level) return b.exp - a.exp;
      return b.level - a.level;
    });
    
    const topUsers = users.slice(0, 10);

    let leaderboardText = isIndo
      ? `*🏆 LEADERBOARD ${bot_name} 🏆*\n━━━━━━━━━━━━━━━━━━\n`
      : `*🏆 ${bot_name} LEADERBOARD 🏆*\n━━━━━━━━━━━━━━━━━━\n`;

    topUsers.forEach((user, index) => {
      
    let status = user.isPremium;
    let verify = ""
    
    if(status == true){
      verify = "ꪜ"
    }else{
      verify = ""
    }
      const rankNum = index + 1;
      const medals = ["🥇", "🥈", "🥉"];
      const rankIcon = medals[index] || `#${rankNum}`;
      leaderboardText += isIndo
        ? `\n${rankIcon} *${user.name} ${verify}*\n\`ID: ${user.id}\`\nLevel: *${user.level}*\nEXP: *${user.exp}*\nRank: *${user.rank || "Beginner"}*\n`
        : `\n${rankIcon} *${user.name}*\n\`ID: ${user.id}\`\nLevel: *${user.level}*\nEXP: *${user.exp}*\n Rank: *${user.rank || "Beginner"}*\n`;
      leaderboardText += "━━━━━━━━━━━━━━━━━━\n";
    });

    leaderboardText += isIndo
      ? `📊 *Total Pengguna:* ${users.length}\n`
      : `📊 *Total Users:* ${users.length}\n`;

    await ctx.replyWithPhoto(
      { source: imagePath },
      {
        caption: leaderboardText,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id
      }
    );
  } catch (err) {
    console.error("❌ Error di /leaderboard:", err);
    await ctx.reply(
      isIndo
        ? "Terjadi kesalahan saat menampilkan leaderboard 😥"
        : "An error occurred while displaying the leaderboard 😥"
    );
  }
};
