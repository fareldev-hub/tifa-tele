// canvas.js
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

/**
 * Draw a rounded rectangle path on the given ctx (does NOT fill or stroke).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number|object} r - radius number or object {tl,tr,br,bl}
 */
function roundRectPath(ctx, x, y, w, h, r) {
  if (typeof r === "number") {
    r = { tl: r, tr: r, br: r, bl: r };
  } else {
    r = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, r);
  }
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

/**
 * Create a profile card image and save it to a temporary file.
 * @param {object} user - user data { id, name, uang, limit, level, exp, maxExp, isPremium }
 * @param {string} photoUrl - URL or local path to user's avatar image
 * @returns {string} path to generated image
 */
async function makeProfileCard(user = {}, photoUrl) {
  const width = 1280;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Ensure output directory
  const outDir = path.join(__dirname, "temp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // === Background (assets/image/welcome.jpg) ===
  const bgPath = path.join(__dirname, "assets/image/ground.jpg");
  try {
    if (fs.existsSync(bgPath)) {
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, width, height);
    } else {
      // fallback plain gradient if background not found
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#667eea");
      grad.addColorStop(1, "#764ba2");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  } catch (err) {
    console.warn("⚠️ Gagal memuat background:", err.message);
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, width, height);
  }

  // === Dark translucent overlay rectangle in center ===
  const overlayWidth = 1100;
  const overlayHeight = 420;
  const overlayX = (width - overlayWidth) / 2;
  const overlayY = (height - overlayHeight) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRectPath(ctx, overlayX, overlayY, overlayWidth, overlayHeight, 30);
  ctx.fill();

  // subtle inner lighter panel
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  roundRectPath(ctx, overlayX + 20, overlayY + 20, overlayWidth - 40, overlayHeight - 40, 22);
  ctx.fill();

  // === Avatar circle ===
  const avatarSize = 220;
  const avatarX = width / 2 - avatarSize / 2;
  const avatarY = overlayY + 30;

  // outer border
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // white ring
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.restore();

  try {
    if (photoUrl) {
      const avatar = await loadImage(photoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // cover mode: drawImage with cropping to square if avatar is not square
      const sx = 0;
      const sy = 0;
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } else {
      // fallback: draw placeholder circle
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } catch (err) {
    console.warn("⚠️ Gagal memuat avatar:", err.message);
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // === Name text ===
  const name = (user.name || "NAMA USER").toString();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Sans";
  ctx.fillText(name, width / 2, avatarY + avatarSize + 50);

  // === EXP bar ===
  const expBarWidth = 720;
  const expBarHeight = 28;
  const expX = width / 2 - expBarWidth / 2;
  const expY = avatarY + avatarSize + 80;
  const exp = Number(user.exp || 0);
  const expMax = Number(user.maxExp || user.level && user.level * 100 || 400);
  const progress = Math.max(0, Math.min(1, expMax > 0 ? exp / expMax : 0));

  // bar background
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRectPath(ctx, expX, expY, expBarWidth, expBarHeight, 20);
  ctx.fill();

  // green progress
  const gradient = ctx.createLinearGradient(expX, 0, expX + expBarWidth, 0);
  gradient.addColorStop(0, "#4df06a");
  gradient.addColorStop(1, "#11c26d");
  ctx.fillStyle = gradient;
  roundRectPath(ctx, expX, expY, expBarWidth * progress, expBarHeight, 20);
  ctx.fill();

  // EXP text
  ctx.font = "20px Sans";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(`EXP : ${exp}/${expMax}`, width / 2, expY + expBarHeight + 30);

  // === Top-left info (Balance & Limit) ===
  const infoLeftX = overlayX + 40;
  const infoTopY = overlayY + 40;
  ctx.textAlign = "left";
  ctx.font = "26px Sans";
  ctx.fillStyle = "#ffffff";
  const balance = typeof user.uang !== "undefined" ? Number(user.uang) : 0;
  ctx.fillText(`Balance : Rp${balance.toLocaleString("id-ID")}`, infoLeftX, infoTopY);
  ctx.fillText(`Limit : ${user.limit ?? 0}`, infoLeftX, infoTopY + 36);

  // === Top-right info (Level) ===
  ctx.textAlign = "right";
  ctx.font = "28px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Level : ${user.level ?? 1}`, overlayX + overlayWidth - 40, infoTopY);

  // === Save output ===
  const filename = `profile-${user.id || Date.now()}.jpg`;
  const outputPath = path.join(outDir, filename);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/jpeg", { quality: 0.9 }));

  return outputPath;
}

module.exports = { makeProfileCard };
