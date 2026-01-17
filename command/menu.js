const fs = require("fs");
const path = require("path");
const { bot_name } = require("../settings");

module.exports = async (ctx) => {
  try {
    const commandDir = path.join(__dirname);

    // 🔘 Daftar gambar
    const images = [
      path.join(__dirname, "../assets/image/welcome.jpg"),
      path.join(__dirname, "../assets/image/celz.jpg")
    ];

    // 🔘 Pilih gambar random
    function getRandomImage() {
      const randomIndex = Math.floor(Math.random() * images.length);
      return images[randomIndex];
    }

    const selectedImage = getRandomImage();

    const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");

    // 🔍 Fungsi deteksi jenis perintah
    function detectCommandType(filePath) {
      try {
        const content = fs.readFileSync(filePath, "utf8");

        const reduceLimit = /user\.limit\s*-\s*=/i.test(content);
        const reduceMoney = /user\.uang\s*-\s*=/i.test(content);
        const useXTR = /(ctx\.replyWithInvoice|currency\s*:\s*["']XTR["'])/i.test(content);

        if (useXTR) return "⭐️";
        if (reduceLimit && reduceMoney) return "🔺️";
        if (reduceLimit) return "🔹️";
        if (reduceMoney) return "🔸️";

        return "";
      } catch {
        return "";
      }
    }

    // 🔍 Ambil daftar command dari folder
    function getCommandsFromFolder(folderPath) {
      if (!fs.existsSync(folderPath)) return [];
      return fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".js"))
        .map((f) => {
          const filePath = path.join(folderPath, f);
          const label = detectCommandType(filePath);
          const baseName = f.replace(".js", "");
          return `▫️ /${baseName}${label ? ` ${label}` : ""}`;
        });
    }

    // Ambil semua folder di /commands
    const folders = fs
      .readdirSync(commandDir)
      .filter((f) => fs.statSync(path.join(commandDir, f)).isDirectory());

    // Ambil semua file utama di command/
    const mainCommands = fs
      .readdirSync(commandDir)
      .filter((f) => f.endsWith(".js") && f !== "menu.js")
      .map((f) => {
        const filePath = path.join(commandDir, f);
        const label = detectCommandType(filePath);
        const baseName = f.replace(".js", "");
        return `▫️ /${baseName}${label ? ` ${label}` : ""}`;
      });

    // 📂 Siapkan daftar command berdasarkan kategori
    let sections = [];

    if (mainCommands.length > 0) {
      const sectionTitle = isIndo ? "📘 *Perintah Utama:*" : "📘 *Main Commands:*";
      sections.push(`${sectionTitle}\n${mainCommands.join("\n")}`);
    }

    for (const folder of folders) {
      const folderPath = path.join(commandDir, folder);
      const cmds = getCommandsFromFolder(folderPath);
      if (cmds.length > 0) {
        const folderTitle = folder.charAt(0).toUpperCase() + folder.slice(1);
        const label = isIndo
          ? `📂 *${folderTitle} Perintah:*`
          : `📂 *${folderTitle} Commands:*`;
        sections.push(`${label}\n${cmds.join("\n")}`);
      }
    }

    const totalCommands =
      mainCommands.length +
      folders.reduce(
        (a, f) => a + getCommandsFromFolder(path.join(commandDir, f)).length,
        0
      );

    // ✨ Pesan utama menu
    const message = isIndo
      ? `Berikut adalah daftar perintah yang dapat Anda gunakan:

${sections.join("\n\n")}

━━━━━━━━━━━━━━━━━━
📊 Total: ${totalCommands} perintah`
      : `Here is a list of commands you can use:

${sections.join("\n\n")}

━━━━━━━━━━━━━━━━━━`;

    // 🔘 Tombol interaktif
    const inlineKeyboard = [
      [
        { text: "Feedback", url: "https://t.me/VionixDev" },
        { text: "Donate", url: "https://saweria.co/fareldeveloper" },
      ],
      [{ text: "About", url: "https://fareldev.up.railway.app" }],
    ];

    // 🖼️ Kirim gambar random
    await ctx.replyWithPhoto(
      { source: selectedImage },
      {
        caption: isIndo
          ? `*✨ Menu ${bot_name} ✨*
━━━━━━━━━━━━━━━━━━
Haloo, saya adalah ${bot_name} sebuah bot multi fungsi yang siap membantu kamuu.`
          : `*✨ ${bot_name} Menu ✨*
━━━━━━━━━━━━━━━━━━
Hello, I am ${bot_name} a multi-function bot ready to help you.`,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: inlineKeyboard },
        reply_to_message_id: ctx.message?.message_id,
      }
    );

    // 📄 Kirim pesan panjang (pakai efek read-more)
    const readmore = "\u200B".repeat(500);
    await ctx.reply(`${readmore}\n${message}`, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error("❌ Error di /menu:", err);
    const msg =
      ctx.isIndo || (ctx.from?.language_code || "").startsWith("id")
        ? "Terjadi kesalahan saat membuka /menu 😥"
        : "An error occurred while opening /menu 😥";
    await ctx.reply(msg);
  }
};
