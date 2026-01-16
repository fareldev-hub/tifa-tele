const si = require("systeminformation");
const os = require("os");
const { loadUser } = require("../handler");

module.exports = async (ctx) => {
  try {
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    // Hitung uptime bot
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    // Ambil data sistem
    let osInfo = {};
    try {
      osInfo = await si.osInfo();
    } catch {
      osInfo = {};
    }

    const mem = await si.mem();

    // Fallback jika OS tidak terdeteksi
    const osName =
      osInfo.distro && osInfo.distro !== "unknown"
        ? `${osInfo.distro} ${osInfo.release}`
        : `${os.type()} ${os.release()} (Node.js ${process.version})`;

    // Hitung RAM
    const usedRAM = (mem.active / 1024 / 1024).toFixed(0);
    const totalRAM = (mem.total / 1024 / 1024).toFixed(0);

    // Format pesan status
    const msg = `
🤖 *Status Bot*

🕒 *Uptime:* ${hours}h ${minutes}m ${seconds}s
💻 *OS:* ${osName}
💾 *RAM:* ${usedRAM}MB / ${totalRAM}MB
💎 *Limit:* ${user.limit}/10
`;

    await ctx.reply(msg.trim(), {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.message?.message_id,
    });
  } catch (err) {
    console.error("❌ Error di /tes:", err);
    await ctx.reply("Terjadi kesalahan saat memproses /tes 😥", {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
};
