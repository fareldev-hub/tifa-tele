/* === HATSUME MIKU BOT (Full Stable Version) === */

const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const chokidar = require("chokidar");
const fetch = require("node-fetch");
const https = require("https");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const {
  loadUser,
  saveUser,
  addExp,
  setupWelcomeHandler,
  setupBanMiddleware,
} = require("./handler");
const { bot_name, google_api_key } = require("./settings");

const bot = new Telegraf(process.env.BOT_TOKEN);

/* === Perbaikan fetch agar tidak error SSL di Termux === */
const agent = new https.Agent({ rejectUnauthorized: false });
global.fetch = (url, opts = {}) => fetch(url, { agent, ...opts });

/* === Bahasa otomatis === */
function getLang(ctx) {
  const lang = ctx.from?.language_code || "en";
  return lang.startsWith("id") ? "id" : "en";
}

/* === Fungsi memuat semua command secara rekursif === */
function loadAllCommands(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const items = fs.readdirSync(baseDir);
  for (const item of items) {
    const fullPath = path.join(baseDir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      loadAllCommands(fullPath);
    } else if (item.endsWith(".js")) {
      const commandName = item.replace(".js", "");
      try {
        delete require.cache[require.resolve(fullPath)];
        const commandFunc = require(fullPath);
        bot.command(commandName, commandFunc);
        console.log(`✅ Command /${commandName} dimuat dari ${baseDir}`);
      } catch (err) {
        console.error(`❌ Gagal memuat /${commandName}:`, err.message);
      }
    }
  }
}

const commandDir = path.join(__dirname, "command");

/* === Middleware anti-banned === */
setupBanMiddleware(bot);

/* === Muat semua command awal === */
loadAllCommands(commandDir);

/* === Fungsi reload command (auto detect perubahan) === */
function reloadCommand(filePath) {
  try {
    delete require.cache[require.resolve(filePath)];
    const commandName = path.basename(filePath, ".js");
    const commandFunc = require(filePath);
    bot.command(commandName, commandFunc);
    console.log(`♻️ Command /${commandName} diperbarui!`);
  } catch (err) {
    console.error(`❌ Gagal reload ${filePath}:`, err.message);
  }
}

/* === Fungsi unload command jika dihapus === */
function unloadCommand(filePath) {
  const commandName = path.basename(filePath, ".js");
  console.log(`🗑️ Command /${commandName} dihapus dari sistem.`);
}

/* === Watcher perubahan command === */
function watchCommands() {
  const watcher = chokidar.watch(commandDir, { ignoreInitial: true, depth: 5 });
  watcher
    .on("add", (file) => {
      if (file.endsWith(".js")) reloadCommand(file);
    })
    .on("change", (file) => {
      if (file.endsWith(".js")) reloadCommand(file);
    })
    .on("unlink", (file) => {
      if (file.endsWith(".js")) unloadCommand(file);
    });
}
watchCommands();

/* === Welcome handler === */
setupWelcomeHandler(bot);

const videoPaths = [
  path.join(__dirname, "assets/thumbnail.mp4"),
  path.join(__dirname, "assets/thumbnail1.mp4"),
];

// fungsi pengembilaan kontent random
function getRandomVideo() {
  const index = Math.floor(Math.random() * videoPaths.length);
  return videoPaths[index];
}

/* === /start === */
bot.start(async (ctx) => {
  const lang = getLang(ctx);
  loadUser(ctx.from.id, ctx.from.first_name);

  const videoPath = getRandomVideo();

  const msg =
    lang === "id"
      ? `👋 Hai *${ctx.from.first_name}!* Selamat datang.\n\n${bot_name} siap membantumu.\nGunakan /feedback atau /owner untuk bantuan. dan gunakan /menu untuk melihat semua daftar fitur yang tersedia.`
      : `👋 Hi *${ctx.from.first_name}!* Welcome.\n\n${bot_name} is ready to assist you.\nUse /feedback or /owner for help. and use /menu to see a list of all available features.`;

  try {
    /*const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "👤 Owner", callback_data: "owner" },
          { text: "💖 Donate", callback_data: "donate" },
        ],
        [{ text: "📦 About Bot", callback_data: "about" }],
      ],
    };
    */

    await ctx.replyWithVideo(
      { source: fs.createReadStream(videoPath) },
      {
        caption: msg,
        parse_mode: "Markdown",
        //  reply_markup: inlineKeyboard,
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ Error di /start:", err);
    ctx.reply(lang === "id" ? "Terjadi kesalahan 😥" : "An error occurred 😥");
  }
});


/* === EXP Handler === */
bot.on("message", async (ctx, next) => {
  try {
    const userData = addExp(ctx.from.id, ctx.from.first_name);
    if (userData.levelUp) {
      await ctx.reply(
        `🎉 Selamat *${userData.name}*! Naik ke level *${userData.level}* 🏆 (+${userData.gain} EXP)`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    console.error("❌ Error EXP Handler:", err);
  }
  return next();
});

/* === Fungsi Escape MarkdownV2 === */
function escapeMarkdownV2(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}


bot.on("text", async (ctx) => {
  const reply = ctx.message.reply_to_message;
  if (!reply || !reply.from?.is_bot) return;

  const session = global.gameSession.get(reply.message_id);
  if (!session) return;

  // hanya user pemilik soal
  if (session.userId !== ctx.from.id) return;

  const answer = ctx.message.text.trim().toLowerCase();

  // ===============================
  // JAWABAN BENAR
  // ===============================
  if (answer === session.answer) {
    global.gameSession.delete(reply.message_id);

    // asahotak → EXP
    if (session.type === "asahotak") {
      const user = loadUser(ctx.from.id, ctx.from.first_name);
      user.exp = (user.exp || 0) + 50;
      saveUser(ctx.from.id, user);

      return ctx.reply(
        "✅ <b>Jawaban BENAR!</b>\n🎉 EXP +50",
        { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" }
      );
    }

    // caklontong → deskripsi lucu
    if (session.type === "caklontong") {
      return ctx.reply(
        `✅ <b>BENAR!</b>\n🤣 ${session.desc}`,
        { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" }
      );
    }
  }

  // ===============================
  // JAWABAN SALAH
  // ===============================
  session.wrong += 1;

  if (session.wrong >= 3) {
    global.gameSession.delete(reply.message_id);

    return ctx.reply(
      `❌ <b>Salah 3x!</b>\n\n<b>Jawaban:</b> ${session.answer}${
        session.desc ? `\n🤣 ${session.desc}` : ""
      }`,
      { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" }
    );
  }

  return ctx.reply(
    `❌ Salah!\n📌 Kesempatan tersisa: ${3 - session.wrong}x`,
    { reply_to_message_id: ctx.message.message_id }
  );
});

bot.on("message", (ctx) => {
  if (ctx.chat.type !== "private") {
    global.groupMembers = global.groupMembers || {};
    global.groupMembers[ctx.chat.id] = global.groupMembers[ctx.chat.id] || [];
    const exists = global.groupMembers[ctx.chat.id].some(
      (u) => u.id === ctx.from.id
    );
    if (!exists) {
      global.groupMembers[ctx.chat.id].push({
        id: ctx.from.id,
        first_name: ctx.from.first_name,
        username: ctx.from.username,
      });
    }
  }
});


/* === Payment Handler === */
bot.on("successful_payment", async (ctx) => {
  try {
    const payment = ctx.message.successful_payment;
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const stars = payment.total_amount;
    const starRate = 10000;
    const amount = stars * starRate;
    user.uang = (user.uang || 0) + amount;
    user.isPremium = true;
    saveUser(ctx.from.id, user);
    await ctx.reply(
      `✅ <b>Top-up Berhasil!</b>\n⭐ <b>${stars} Stars</b>\n💰 Rp${amount.toLocaleString(
        "id-ID"
      )}\n📊 Saldo: Rp${user.uang.toLocaleString("id-ID")}`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error Payment:", err);
  }
});

/* === Reset Limit Tiap Malam === */
cron.schedule("0 0 * * *", () => {
  const dbPath = path.join(__dirname, "database/users.json");
  if (!fs.existsSync(dbPath)) return;
  const db = JSON.parse(fs.readFileSync(dbPath));
  Object.keys(db).forEach((id) => (db[id].limit = 20));
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log("✅ Limit pengguna direset otomatis setiap 24 jam.");
});

/* === Global Error Handler === */
bot.catch((err, ctx) => {
  console.error(`❌ Error pada ${ctx.updateType}:`, err);
});

/* === Jalankan Bot === */
bot.launch();
console.log(`\n🤖 ${bot_name} aktif! Auto reload, /start fix & AI otomatis stabil 🚀`);
