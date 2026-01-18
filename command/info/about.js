const { loadUser } = require("../../handler");
const { bot_name } = require("../../settings");

module.exports = async (ctx) => {
  try {
    const lang = ctx.from?.language_code?.startsWith("id") ? "id" : "en";
    const user = loadUser(ctx.from.id, ctx.from.first_name);
    const date = new Date();
    const year = date.getFullYear();

    const lines = "━━━━━━━━━━━━━━━━━━";

    const text_id = `<b>✨ Tentang ${bot_name}</b>
    
Halo ${ctx.from.username ? "@" + ctx.from.username : ctx.from.first_name} ${bot_name} adalah asisten Telegram multifungsi yang dikembangkan oleh <b>Farel Alfareza</b>. Bot ini dibuat untuk membantu pengguna dengan fitur seperti AI, utilitas, dan hiburan.

${lines}
<b>👨 Developer:</b> Farel Alfareza
<b>💻 Programmer:</b> Farel Alfareza  
<b>🔗 API 1:</b> <a href="https://endpoint-hub.up.railway.app">Endpoint-Hub</a>
<b>🔗 API 2:</b> <a href="https://api.siputzx.my.id">Siputzx API</a>
<b>🔗 API 3:</b> <a href="https://api.nekolabs.web.id">Nekolabs</a>
<b>🔗 API 4:</b> <a href="https://api.deline.web.id">Deline API</a>
<b>🔗 API 5:</b> <a href="https://api.yupra.my.id">Yupra</a>
<b>🔗 API 6:</b> <a href="https://zellapi.autos">Zellapi</a>

${lines}
<b>🌐 Akun Sosial:</b>
• <a href="https://instagram.com/logic__vibes">Instagram</a>  
• <a href="https://tiktok.com/@logic__vibes">TikTok</a>  
• <a href="https://www.facebook.com/share/1A7YByy2rn/">Facebook</a>  
• <a href="https://github.com/FarelDev-hub">GitHub</a>  
<b>💻 Website:</b> <a href="https://fareldev.up.railway.app">fareldev</a>

${lines}
<b>📚 Perintah:</b>
• /donasi → Dukung pengembangan bot  
• /owner → Hubungi developer  

${lines}
<b>⚡ Powered by</b> @telegram
<pre>© ${year} - FarProject</pre>
`;

    // 🇬🇧 English
    const text_en = `<b>✨ About ${bot_name}</b>
    
Hello ${ctx.from.username ? "@" + ctx.from.username : ctx.from.first_name} ${bot_name} is a multifunctional Telegram assistant developed by <b>Farel Alfareza</b>. It helps users with various AI, utility, and entertainment features.

${lines}
<b>👨 Developer: </b> Farel Alfareza
<b>💻 Programmer: </b> Farel Alfareza  
<b>🔗 API 1:</b> <a href="https://api.siputzx.my.id">Siputzx API</a>
<b>🔗 API 2:</b> <a href="https://api.nekolabs.web.id">Nekolabs</a>
<b>🔗 API 3:</b> <a href="https://api.deline.web.id">Deline API</a>
<b>🔗 API 4:</b> <a href="https://api.yupra.my.id">Yupra</a>
<b>🔗 API 5:</b> <a href="https://zellapi.autos">Zellapi</a>

${lines}
<b>🌐 Social Accounts:</b>
• <a href="https://instagram.com/logic__vibes">Instagram</a>  
• <a href="https://tiktok.com/@logic__vibes">TikTok</a>  
• <a href="https://www.facebook.com/share/1A7YByy2rn/">Facebook</a>  
• <a href="https://github.com/FarelDev-hub">GitHub</a>  
<b>💻 Website:</b> <a href="https://fareldev.up.railway.app">fareldev</a>

${lines}
<b>📚 Commands:</b>
• /donasi → Support bot development  
• /owner → Contact developer  

${lines}
<b>⚡ Powered by</b> @telegram
<pre>© ${year} - FarProject</pre>
`;

    const msg = lang === "id" ? text_id : text_en;

    await ctx.reply(msg, {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message?.message_id,
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error("❌ Error di /info:", err);
    await ctx.reply("⚠️ Terjadi kesalahan saat menampilkan informasi bot.");
  }
};
