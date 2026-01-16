const fetch = require("node-fetch");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /npmsearch <package_name>"
          : "💡 Use format: /npmsearch <package_name>",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const waitMsg = await ctx.reply(
      isIndo ? "⏳ Mencari package di NPM..." : "⏳ Searching NPM packages...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    const apiUrl = `https://api.deline.web.id/search/npm?q=${encodeURIComponent(input)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !data?.result || data.result.length === 0) {
      throw new Error(isIndo ? "❌ Package tidak ditemukan." : "❌ No package found.");
    }

    // Format results
    let msg = isIndo ? `📦 Hasil pencarian npm untuk *${input}*:\n\n` : `📦 NPM search results for *${input}*:\n\n`;
    data.result.forEach((pkg, i) => {
      msg += `*${i + 1}. ${pkg.name}* (v${pkg.version})\n`;
      msg += `📝 ${pkg.description || "No description"}\n`;
      if (pkg.links?.npm) msg += `🔗 [NPM](${pkg.links.npm})\n`;
      if (pkg.links?.homepage) msg += `🏠 [Homepage](${pkg.links.homepage})\n`;
      if (pkg.links?.repository) msg += `📂 [Repository](${pkg.links.repository})\n`;
      msg += `👤 Author: ${pkg.author || "N/A"}\n`;
      msg += `📅 Published: ${new Date(pkg.date).toLocaleDateString()}\n\n`;
    });

    await ctx.replyWithMarkdown(msg, { reply_to_message_id: ctx.message?.message_id });

    try { await ctx.deleteMessage(waitMsg.message_id); } catch {}

  } catch (err) {
    console.error("⚠️ Error utama:", err);
    ctx.reply(
      (ctx.from.language_code || "en").startsWith("id")
        ? `⚠️ Gagal mencari package npm. ${err.message}`
        : `⚠️ Failed to search NPM packages. ${err.message}`,
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
