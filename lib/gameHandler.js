/* === Game Handler - Automatic Game Management System === */

const fs = require("fs");
const path = require("path");

// In-memory game session storage
global.gameSession = new Map();

/**
 * Auto-load all game configurations from command/game/ directory
 */
function loadGameConfigs() {
  const gameDir = path.join(__dirname, "..", "command", "game");
  const games = new Map();

  if (!fs.existsSync(gameDir)) {
    console.log("⚠️ Game directory not found:", gameDir);
    return games;
  }

  const files = fs.readdirSync(gameDir).filter(f => f.endsWith(".js"));
  
  for (const file of files) {
    try {
      const gamePath = path.join(gameDir, file);
      delete require.cache[require.resolve(gamePath)];
      const gameConfig = require(gamePath);
      
      // Register game if it has required properties
      if (gameConfig.name && gameConfig.start) {
        games.set(gameConfig.name, {
          ...gameConfig,
          file: file
        });
        console.log(`✅ Game loaded: ${gameConfig.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load game ${file}:`, err.message);
    }
  }

  return games;
}

// Load games once
let gameConfigs = loadGameConfigs();

/**
 * Reload games (called when file changes detected)
 */
function reloadGameConfigs() {
  gameConfigs = loadGameConfigs();
}

/**
 * Get all registered game names
 */
function getGameNames() {
  return Array.from(gameConfigs.keys());
}

/**
 * Check if a game type exists
 */
function gameExists(gameType) {
  return gameConfigs.has(gameType);
}

/**
 * Start a game session
 */
function startGame(ctx, gameType, questionData) {
  const game = gameConfigs.get(gameType);
  if (!game) {
    ctx.reply(`❌ Game "${gameType}" not found.`);
    return null;
  }

  const { soal, jawaban } = questionData;
  
  // Create session
  const sessionData = {
    type: gameType,
    userId: ctx.from.id,
    answer: jawaban.toLowerCase(),
    wrong: 0,
    gameData: questionData
  };

  global.gameSession.set(ctx.message.message_id + 1, sessionData);

  // Build message using game's template or default
  const message = game.buildMessage 
    ? game.buildMessage(questionData) 
    : `🎮 <b>${game.displayName || gameType}</b>\n\n<b>Pertanyaan:</b>\n${soal}\n\n✍️ <i>Reply pesan ini untuk menjawab</i>`;

  return { sent: ctx.reply(message, { parse_mode: "HTML", allow_sending_without_reply: true }), sessionData };
}

/**
 * Handle answer checking - generic version that works for all games
 */
async function handleAnswer(ctx, replyMessageId, answer) {
  const session = global.gameSession.get(replyMessageId);
  if (!session) return false;

  // Only the question owner can answer
  if (session.userId !== ctx.from.id) return false;

  const game = gameConfigs.get(session.type);
  const userAnswer = answer.trim().toLowerCase();

  // Check answer
  if (userAnswer === session.answer) {
    global.gameSession.delete(replyMessageId);

    // Use game's custom win handler or default
    if (game && game.onWin) {
      await game.onWin(ctx, session);
    } else {
      // Default win message
      let rewardText = "";
      if (game && game.reward) {
        rewardText = `\n🎁 ${game.reward}`;
      }
      
      await ctx.reply(
        `✅ <b>Jawaban BENAR!</b>${rewardText}`,
        { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" }
      );
    }
    return true;
  }

  // Wrong answer
  session.wrong += 1;
  const maxWrong = game?.maxWrongAttempts || 3;

  if (session.wrong >= maxWrong) {
    global.gameSession.delete(replyMessageId);

    // Use game's custom lose handler or default
    if (game && game.onLose) {
      await game.onLose(ctx, session);
    } else {
      // Default lose message
      let extraInfo = "";
      if (session.gameData && session.gameData.deskripsi) {
        extraInfo = `\n🤣 ${session.gameData.deskripsi}`;
      }

      await ctx.reply(
        `❌ <b>Salah ${maxWrong}x!</b>\n\n<b>Jawaban:</b> ${session.answer}${extraInfo}`,
        { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" }
      );
    }
    return true;
  }

  // Still has attempts left
  const remaining = maxWrong - session.wrong;
  await ctx.reply(
    `❌ Salah!\n📌 Kesempatan tersisa: ${remaining}x`,
    { reply_to_message_id: ctx.message.message_id }
  );
  
  return true;
}

/**
 * Game template for creating new games easily
 */
const gameTemplate = {
  // Required
  name: "gamename",        // Unique identifier (filename without .js)
  displayName: "Game Name", // Shown in messages
  reward: "EXP +50",       // Reward text
  
  // Optional
  maxWrongAttempts: 3,     // Max wrong answers before losing
  
  /**
   * Start the game - fetches question and sends it
   */
  start: async (ctx) => {
    // Override this to fetch question from API
    // Must return { soal, jawaban, deskripsi? }
  },
  
  /**
   * Optional: Custom message builder
   */
  buildMessage: (questionData) => {
    return `🎮 <b>${this.displayName}</b>\n\n<b>Pertanyaan:</b>\n${questionData.soal}\n\n✍️ <i>Reply pesan ini untuk menjawab</i>`;
  },
  
  /**
   * Optional: Custom win handler
   */
  onWin: async (ctx, session) => {
    // Add EXP, money, etc. here
    // Use loadUser() and saveUser() from handler.js
  },
  
  /**
   * Optional: Custom lose handler
   */
  onLose: async (ctx, session) => {
    // Custom lose behavior
  }
};

module.exports = {
  loadGameConfigs,
  reloadGameConfigs,
  getGameNames,
  gameExists,
  startGame,
  handleAnswer,
  gameTemplate
};

