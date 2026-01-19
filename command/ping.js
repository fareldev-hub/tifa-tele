const os = require("os");
const { createCanvas } = require("canvas");
const { execSync } = require("child_process");
const { performance } = require("perf_hooks");

module.exports = async (ctx) => {
  try {
    // ================= THEME =================
    const THEME = {
      bg: "#0f1419",
      bgSecondary: "#1a1f2e",
      card: "#1e2433",
      border: "#2d3548",
      primary: "#3b82f6",
      success: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      purple: "#8b5cf6",
      cyan: "#06b6d4",
      pink: "#ec4899",
      textPrimary: "#f1f5f9",
      textSecondary: "#94a3b8",
      textTertiary: "#64748b",
      glow: "rgba(59,130,246,0.3)"
    };

    // ================= UTILS =================
    const formatSize = (bytes) => {
      if (!bytes) return "0 B";
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
    };

    const formatTime = (sec) => {
      sec = Number(sec);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    // ================= CANVAS =================
    const W = 1200;
    const H = 650;
    const canvas = createCanvas(W, H);
    const ctx2 = canvas.getContext("2d");

    // Background
    const bg = ctx2.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, THEME.bg);
    bg.addColorStop(1, THEME.bgSecondary);
    ctx2.fillStyle = bg;
    ctx2.fillRect(0, 0, W, H);

    // Card helper
    const card = (x, y, w, h) => {
      ctx2.fillStyle = THEME.card;
      ctx2.strokeStyle = THEME.border;
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.roundRect(x, y, w, h, 15);
      ctx2.fill();
      ctx2.stroke();
    };

    // ================= SYSTEM DATA =================
    const start = performance.now();
    await new Promise(r => setTimeout(r, 15));
    const latency = (performance.now() - start).toFixed(2);

    const cpus = os.cpus();
    const load = os.loadavg()[0];
    const cpuLoad = Math.min(100, ((load * 100) / cpus.length)).toFixed(1);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    let diskTotal = 0;
    let diskUsed = 0;
    try {
      const df = execSync("df -k /")
        .toString()
        .split("\n")[1]
        .trim()
        .split(/\s+/);
      diskTotal = Number(df[1]) * 1024;
      diskUsed = Number(df[2]) * 1024;
    } catch {}

    // ================= DRAW =================
    card(40, 40, 1120, 90);
    ctx2.fillStyle = THEME.textPrimary;
    ctx2.font = "bold 34px Arial";
    ctx2.fillText("SERVER MONITOR", 70, 95);

    ctx2.fillStyle =
      latency < 100
        ? THEME.success
        : latency < 300
        ? THEME.warning
        : THEME.danger;

    ctx2.font = "bold 32px Arial";
    ctx2.textAlign = "right";
    ctx2.fillText(`${latency} ms`, W - 70, 95);
    ctx2.textAlign = "left";

    // CPU
    card(40, 160, 340, 180);
    ctx2.fillStyle = THEME.primary;
    ctx2.font = "bold 22px Arial";
    ctx2.fillText("CPU", 60, 200);
    ctx2.fillStyle = THEME.textPrimary;
    ctx2.font = "bold 30px Arial";
    ctx2.fillText(`${cpuLoad}%`, 60, 240);
    ctx2.font = "12px Arial";
    ctx2.fillStyle = THEME.textSecondary;
    ctx2.fillText(cpus[0].model, 60, 270);

    // RAM
    card(430, 160, 340, 180);
    ctx2.fillStyle = THEME.success;
    ctx2.font = "bold 22px Arial";
    ctx2.fillText("RAM", 450, 200);
    ctx2.fillStyle = THEME.textPrimary;
    ctx2.font = "bold 22px Arial";
    ctx2.fillText(
      `${formatSize(totalMem - freeMem)} / ${formatSize(totalMem)}`,
      450,
      240
    );

    // DISK
    card(820, 160, 340, 180);
    ctx2.fillStyle = THEME.purple;
    ctx2.font = "bold 22px Arial";
    ctx2.fillText("DISK", 840, 200);
    ctx2.fillStyle = THEME.textPrimary;
    ctx2.font = "bold 22px Arial";
    ctx2.fillText(
      `${formatSize(diskUsed)} / ${formatSize(diskTotal)}`,
      840,
      240
    );

    // INFO
    card(40, 380, 1120, 220);
    ctx2.fillStyle = THEME.textPrimary;
    ctx2.font = "bold 18px Arial";
    ctx2.fillText("SYSTEM INFO", 70, 420);

    ctx2.font = "14px Arial";
    ctx2.fillText(`OS      : ${os.platform()} ${os.release()}`, 70, 460);
    ctx2.fillText(`Node    : ${process.version}`, 70, 490);
    ctx2.fillText(`Bot UP  : ${formatTime(process.uptime())}`, 70, 520);
    ctx2.fillText(`Server  : ${formatTime(os.uptime())}`, 70, 550);

    // ================= SEND =================
    await ctx.replyWithPhoto(
      { source: canvas.toBuffer() },
      {
        caption:
`🖥️ *SERVER INFORMATION*

• Latency : ${latency} ms
• CPU     : ${cpuLoad}%
• RAM     : ${formatSize(totalMem - freeMem)} / ${formatSize(totalMem)}
• Disk    : ${formatSize(diskUsed)} / ${formatSize(diskTotal)}

⏱ Updated: ${new Date().toLocaleString()}`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message?.message_id
      }
    );

  } catch (e) {
    console.error(e);
    ctx.reply(
      `❌ Error: ${e.message}`,
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
