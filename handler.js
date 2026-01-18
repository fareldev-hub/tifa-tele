const fs = require("fs");
const path = require("path");

// === ANSI COLORS ===
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

// === DATABASE ===
const dbPath = path.join(__dirname, "database", "users.json");

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
}

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8") || "{}");
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
    return {};
  }
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// === USER ===
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
      rank: "Newbie",
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

// === EXP ===
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
    user.level < 2 ? "Newbie" :
    user.level < 5 ? "Bronze" :
    user.level < 10 ? "Silver" :
    user.level < 20 ? "Gold" :
    user.level < 35 ? "Platinum" :
    user.level < 50 ? "Emerald" :
    user.level < 70 ? "Sapphire" :
    user.level < 100 ? "Ruby" :
    user.level < 150 ? "Diamond" :
    "Legenda";

  saveUser(id, user);
  return { ...user, gain, levelUp };
}

// === SAFE SEND ===
async function safeReply(ctx, method, ...args) {
  try {
    return await ctx[method](...args);
  } catch (err) {
    if (err?.response?.error_code === 403) return null;
    console.error("❌ Telegram send error:", err.message);
    return null;
  }
}

// === WELCOME ===
function setupWelcomeHandler(bot) {
  bot.telegram.getMe().then(info => bot.botInfo = info);

  bot.on("new_chat_members", async (ctx) => {
    if (!bot.botInfo) return;

    for (const member of ctx.message.new_chat_members) {
      if (member.is_bot || member.id === bot.botInfo.id) continue;

      const name = member.first_name || "Pengguna";
      loadUser(member.id, name);

      const mention = `<a href="tg://user?id=${member.id}">${name}</a>`;
      const msg =
        `👋 Halo ${mention}!\n\n` +
        `Selamat datang di <b>${ctx.chat.title}</b> 🎉\n` +
        `/start | /menu`;

      await safeReply(ctx, "reply", msg, {
        parse_mode: "HTML",
        message_thread_id: ctx.message?.message_thread_id
      });
    }
  });
}

// === BAN MIDDLEWARE ===
function setupBanMiddleware(bot) {
  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();

    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // === Ambil isi pesan dari semua tipe update ===
    let content = "[unknown]";
    let type = "unknown";

    if (ctx.message) {
      type = ctx.message.photo
        ? "photo"
        : ctx.message.video
        ? "video"
        : ctx.message.sticker
        ? "sticker"
        : ctx.message.document
        ? "document"
        : "text";

      content =
        ctx.message.text ||
        ctx.message.caption ||
        `[${type.toUpperCase()}]`;
    } else if (ctx.editedMessage) {
      type = "edited";
      content = ctx.editedMessage.text || ctx.editedMessage.caption || "[edited]";
    } else if (ctx.callbackQuery) {
      type = "callback";
      content = ctx.callbackQuery.data;
    } else if (ctx.inlineQuery) {
      type = "inline";
      content = ctx.inlineQuery.query;
    } else {
      content = "[non-text update]";
    }

    const time = new Date().toLocaleString("id-ID", { hour12: false });

    // === LOG KE TERMINAL (LENGKAP) ===
    console.log(
      color.gray + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + color.reset
    );
    console.log(`${color.blueBg}${color.bold}${color.cyan} 🕒 ${time} ${color.reset}`);
    console.log(`${color.yellow}👤 User   :${color.reset} ${ctx.from.first_name}`);
    console.log(`${color.yellow}🆔 ID     :${color.reset} ${ctx.from.id}`);
    console.log(`${color.yellow}💬 Tipe   :${color.reset} ${type}`);
    console.log(`${color.yellow}📩 Pesan  :${color.reset} ${content}`);
    console.log(
      color.gray + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" + color.reset
    );

    // 🚫 Jika dibanned → stop
    if (user.isBanned) {
      console.log(color.red + "🚫 Banned user blocked" + color.reset);
      return;
    }

    return next();
  });
}


module.exports = {
  loadUser,
  saveUser,
  addExp,
  setupWelcomeHandler,
  setupBanMiddleware
};
