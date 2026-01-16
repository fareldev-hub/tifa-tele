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

// Fungsi untuk ambil video random
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

/* === AI Otomatis (stabil /ai / message reply) === */
bot.on("message", async (ctx, next) => {
  try {
    const message = ctx.message.text?.trim();
    const hasPhoto = !!ctx.message.photo;

    if (!message && !hasPhoto) return next();
    if (message && message.startsWith("/")) return next();

    if (
      ["group", "supergroup"].includes(ctx.chat.type) &&
      !(message?.includes(`@${ctx.me.username}`) ||
        ctx.message.reply_to_message?.from?.id === ctx.botInfo.id)
    )
      return next();

    if (hasPhoto && !ctx.message.reply_to_message) return next();

    let targetPhotoMessage = null;
    if (
      ctx.message.reply_to_message &&
      ctx.message.reply_to_message.photo &&
      ctx.message.reply_to_message.photo.length > 0
    )
      targetPhotoMessage = ctx.message.reply_to_message;

    const isIndo = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    if (user.limit <= 0)
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );

    user.limit -= 1;
    saveUser(ctx.from.id, user);

    /* =====================
       THINKING
    ===================== */
    const thinkingMsg = await ctx.reply(
      isIndo ? "💭 Sedang berpikir..." : "💭 Thinking...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    const loadingStates = ["", ".", "..", "..."];
    let i = 0;
    const interval = setInterval(() => {
      ctx.telegram
        .editMessageText(
          ctx.chat.id,
          thinkingMsg.message_id,
          undefined,
          `${isIndo ? "💭 Sedang berpikir" : "💭 Thinking"}${loadingStates[i++ % loadingStates.length]}`
        )
        .catch(() => {});
    }, 900);

    /* =====================
       PREPARE PROMPT
    ===================== */
    let promptText = "";

    if (targetPhotoMessage) {
      promptText =
        message || "Jelaskan gambar ini secara detail dengan gaya lucu.";
    } else {
      promptText = message;
    }

    /* =====================
       CALL ENDPOINT TIFA
    ===================== */
    const url = `https://endpoint-hub.up.railway.app/api/chatai/tifa?text=${encodeURIComponent(
      promptText
    )}`;

    const res = await fetch(url);
    const json = await res.json();

    clearInterval(interval);

    const aiText =
      json?.response ||
      (isIndo ? "Aku bingung jawabnya 😅" : "I'm not sure 😅");

    /* =====================
       SEND RESULT
    ===================== */
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinkingMsg.message_id,
      undefined,
      aiText,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: isIndo ? "Bagikan" : "Share",
                switch_inline_query: message || "",
              },
            ],
          ],
        },
      }
    );
  } catch (err) {
    console.error("❌ Error AI otomatis:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "⚠️ Terjadi kesalahan saat AI merespons 😥"
        : "⚠️ Error occurred while AI was responding 😥",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
  return next();
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
