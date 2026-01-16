const fs = require("fs");
const path = require("path");
const { Markup } = require("telegraf");

// 🎨 Warna ANSI untuk terminal
const color = {
  reset: "\x1b[0m",
  blueBg: "\x1b[44m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  bold: "\x1b[1m"
};

// === Database Path ===
const dbPath = path.join(__dirname, "database", "users.json");

// Pastikan direktori dan file database tersedia
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
}

// === Database Utilities ===
function loadDB() {
  try {
    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data || "{}");
  } catch (err) {
    console.error(color.red + "⚠️ users.json rusak — membuat ulang..." + color.reset);
    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
    return {};
  }
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// === User Management ===
function loadUser(id, name = "User") {
  const db = loadDB();

  if (!db[id]) {
    db[id] = {
      id,
      name,
      exp: 0,
      level: 1,
      limit: 20,
      uang: 1000,
      rank: "Bronze",
      isBanned: false,
      isPremium: false
    };
  } else if (name && db[id].name !== name) {
    db[id].name = name;
  }

  saveDB(db);
  return db[id];
}

function saveUser(id, data) {
  const db = loadDB();
  db[id] = data;
  saveDB(db);
}

// === EXP System ===
function addExp(id, name) {
  const user = loadUser(id, name);
  const gain = Math.floor(Math.random() * 10) + 5;
  user.exp += gain;

  const expPerLevel = 400;
  let levelUp = false;

  while (user.exp >= expPerLevel) {
    user.exp -= expPerLevel;
    user.level++;
    user.uang += 100;
    levelUp = true;
}
user.rank =
  user.level < 2   ? "Newbine" :
  user.level < 5   ? "Bronze" :
  user.level < 10  ? "Silver" :
  user.level < 20  ? "Gold" :
  user.level < 35  ? "Platinum" :
  user.level < 50  ? "Emerald" :
  user.level < 70  ? "Sapphire" :
  user.level < 100  ? "Ruby" :
  user.level < 150 ? "Diamond" :
  "Legenda";


  saveUser(id, user);
  return { ...user, gain, levelUp };
}

// === Welcome Handler ===
function setupWelcomeHandler(bot) {
  bot.telegram.getMe().then(info => {
    bot.botInfo = info;
  });

  bot.on("new_chat_members", async (ctx) => {
    try {
      if (!bot.botInfo) return;

      for (const member of ctx.message.new_chat_members) {
        if (member.is_bot) continue; // ✅ Jangan sambut bot
        if (member.id === bot.botInfo.id) continue;

        const name = member.first_name || "Pengguna";
        const mention = `[${name}](tg://user?id=${member.id})`;
        const lang = member.language_code || "id";

        loadUser(member.id, name);

        const msg = lang.startsWith("id")
          ? `👋 Halo ${mention}!\n\nSelamat datang di *${ctx.chat.title}* 🎉\nGunakan perintah berikut untuk memulai bot:\n/start or /menu`
          : `👋 Hello ${mention}!\n\nWelcome to *${ctx.chat.title}* 🎉\nUse the following command to start the bot:\n/start or /menu`;

        await ctx.replyWithMarkdown(msg);

        // === LOGGING KE TERMINAL ===
        const time = new Date().toLocaleString("id-ID", { hour12: false });
        console.log(
          color.gray + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + color.reset
        );
        console.log(`${color.blueBg}${color.bold}${color.cyan} 🕒 ${time} ${color.reset}`);
        console.log(`${color.yellow}👥 Grup     :${color.reset} ${ctx.chat.title}`);
        console.log(`${color.yellow}👤 Nama     :${color.reset} ${name}`);
        console.log(`${color.yellow}🆔 ID       :${color.reset} ${member.id}`);
        console.log(`${color.green}✅ Status   :${color.reset} Bergabung / Ditambahkan`);
        console.log(
          color.gray + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" + color.reset
        );
      }
    } catch (err) {
      console.error(color.red + "❌ Gagal menyapa member baru:" + color.reset, err);
    }
  });
}

// === 🔰 Middleware: Logger + Anti-Banned ===
function setupBanMiddleware(bot) {
  bot.use(async (ctx, next) => {
    try {
      if (!ctx.from) return next();
      const user = loadUser(ctx.from.id, ctx.from.first_name);

      // Ambil teks dari berbagai tipe update
      const msgText =
        ctx.message?.text ||
        ctx.editedMessage?.text ||
        ctx.callbackQuery?.data ||
        ctx.inlineQuery?.query ||
        ctx.chosenInlineResult?.query ||
        "[non-text update]";

      const time = new Date().toLocaleString("id-ID", { hour12: false });

      // === Log ke terminal ===
      console.log(color.gray + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + color.reset);
      console.log(`${color.blueBg}${color.bold}${color.cyan} 🕒 ${time} ${color.reset}`);
      console.log(`${color.yellow}👤 User ID :${color.reset} ${ctx.from.id}`);
      console.log(`${color.yellow}📛 Nama    :${color.reset} ${ctx.from.first_name}`);
      console.log(`${color.yellow}💬 Pesan   :${color.reset} ${msgText}`);
      console.log(color.gray + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" + color.reset);

      // === Jika user dibanned ===
      if (user.isBanned) {
        console.log(color.red + `🚫 User ${ctx.from.first_name} (${ctx.from.id}) dibanned — abaikan perintah.` + color.reset);
        try {
          let bannedMsg = `Id :
🚫 Kau telah di banner hubungi /owner untuk meminta peninjauan kembali.

En :
🚫 You have been bannered contact /owner to request a review.`
          await ctx.reply(bannedMsg, {
            parse_mode: "Markdown"
          });
        } catch {}
        return;
      }

      // Lanjut ke handler berikutnya
      await next();
    } catch (err) {
      console.error(color.red + "❌ Error di setupBanMiddleware:" + color.reset, err);
      return next();
    }
  });
}

module.exports = {
  loadUser,
  saveUser,
  addExp,
  setupWelcomeHandler,
  setupBanMiddleware
};
