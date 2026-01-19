const fetch = require("node-fetch");
const { createCanvas } = require("canvas");
const { performance } = require("perf_hooks");
const { loadUser } = require("../handler");

module.exports = async (ctx) => {
  try {
    const isID = (ctx.from?.language_code || "").startsWith("id");
    const user = loadUser(ctx.from.id, ctx.from.first_name);

    const waitMsg = await ctx.reply(
      isID
        ? "🚀 Mengukur kecepatan internet server..."
        : "🚀 Testing server internet speed...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // ===============================
    // SPEED TEST
    // ===============================
    const pingStart = performance.now();
    await fetch("https://www.google.com/generate_204");
    const ping = Math.round(performance.now() - pingStart);

    const dlStart = performance.now();
    const dlRes = await fetch("https://speed.cloudflare.com/__down?bytes=5000000");
    const dlBuf = await dlRes.arrayBuffer();
    const dlTime = (performance.now() - dlStart) / 1000;
    const downloadMbps = Math.min(
      999,
      ((dlBuf.byteLength / 1024 / 1024) * 8 / dlTime).toFixed(2)
    );

    const ulData = Buffer.alloc(1 * 1024 * 1024);
    const ulStart = performance.now();
    await fetch("https://httpbin.org/post", { method: "POST", body: ulData });
    const ulTime = (performance.now() - ulStart) / 1000;
    const uploadMbps = Math.min(999, ((1 * 8) / ulTime).toFixed(2));

    // ===============================
    // CANVAS
    // ===============================
    const W = 900;
    const H = 480;
    const canvas = createCanvas(W, H);
    const c = canvas.getContext("2d");

    // Background
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#020617");
    bg.addColorStop(1, "#0f172a");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // Title
    c.fillStyle = "#38bdf8";
    c.font = "bold 32px Arial";
    c.fillText("INTERNET SPEED TEST", 40, 55);

    c.fillStyle = "#94a3b8";
    c.font = "15px Arial";
    c.fillText(
      isID ? "Kecepatan koneksi server bot" : "Bot server connection speed",
      40,
      78
    );

    // ===============================
    // UTIL
    // ===============================
    const clamp = (t, m) => (t.length > m ? t.slice(0, m - 1) + "…" : t);

    const drawCard = (x, y, w, h, color) => {
      c.fillStyle = "#020617";
      c.fillRect(x, y, w, h);
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.strokeRect(x, y, w, h);
    };

    const drawCircle = (cx, cy, r, percent, color, value, label) => {
      const p = Math.min(100, percent);

      // BG ring
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.strokeStyle = "#1e293b";
      c.lineWidth = 10;
      c.stroke();

      // Progress ring
      c.beginPath();
      c.arc(
        cx,
        cy,
        r,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * (p / 100)
      );
      c.strokeStyle = color;
      c.lineWidth = 10;
      c.stroke();

      // Value (CENTER)
      c.fillStyle = "#e5e7eb";
      c.font = "bold 24px Arial";
      c.textAlign = "center";
      c.fillText(clamp(value, 10), cx, cy + 8);

      // Label (BELOW CIRCLE)
      c.fillStyle = "#94a3b8";
      c.font = "bold 14px Arial";
      c.fillText(label, cx, cy + r + 28);
    };

    // ===============================
    // CARDS
    // ===============================
    const cardY = 110;
    const cardW = 260;
    const cardH = 250;
    const gap = 30;

    drawCard(40, cardY, cardW, cardH, "#22c55e");
    drawCircle(
      40 + cardW / 2,
      cardY + 110,
      55,
      (ping / 500) * 100,
      "#22c55e",
      `${ping} ms`,
      "PING"
    );

    drawCard(40 + cardW + gap, cardY, cardW, cardH, "#3b82f6");
    drawCircle(
      40 + cardW + gap + cardW / 2,
      cardY + 110,
      55,
      (downloadMbps / 100) * 100,
      "#3b82f6",
      `${downloadMbps} Mbps`,
      "DOWNLOAD"
    );

    drawCard(40 + (cardW + gap) * 2, cardY, cardW, cardH, "#f59e0b");
    drawCircle(
      40 + (cardW + gap) * 2 + cardW / 2,
      cardY + 110,
      55,
      (uploadMbps / 50) * 100,
      "#f59e0b",
      `${uploadMbps} Mbps`,
      "UPLOAD"
    );

    // ===============================
    // FOOTER
    // ===============================
    c.textAlign = "left";
    c.fillStyle = "#94a3b8";
    c.font = "14px Arial";
    c.fillText(`User: ${clamp(user.name, 18)}`, 40, H - 40);
    c.fillText(`Level: ${user.level}`, 40, H - 20);

    c.textAlign = "right";
    c.fillText(
      `Generated: ${new Date().toLocaleString()}`,
      W - 40,
      H - 20
    );

    // ===============================
    // SEND
    // ===============================
    await ctx.replyWithPhoto(
      { source: canvas.toBuffer("image/png") },
      {
        caption: isID
          ? "📡 Hasil tes kecepatan internet server"
          : "📡 Server internet speed test result",
        reply_to_message_id: ctx.message?.message_id,
      }
    );

    await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);

  } catch (err) {
    console.error("❌ Error /speed:", err);
    ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "❌ Gagal melakukan tes kecepatan internet."
        : "❌ Failed to test internet speed.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
