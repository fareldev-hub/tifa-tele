const axios = require("axios");

const AVAILABLE = [
  "indonesia",
  "china",
  "japan",
  "korea",
  "thailand",
  "vietnam",
];

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    const text = ctx.message?.text || "";
    const country = text.split(" ").slice(1).join(" ").trim().toLowerCase();

    if (!AVAILABLE.includes(country)) {
      return ctx.reply(
        isIndo
          ? `💡 Gunakan:\n/cecan <negara>\n\nTersedia:\n${AVAILABLE.join(", ")}`
          : `💡 Use:\n/cecan <country>\n\nAvailable:\n${AVAILABLE.join(", ")}`,
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    const apiUrl = `https://api.siputzx.my.id/api/r/cecan/${country}`;

    const res = await axios.get(apiUrl, {
      responseType: "arraybuffer", // 🔥 PENTING
      timeout: 30_000,
      validateStatus: () => true,
    });

    const contentType = res.headers["content-type"] || "";

    // ===============================
    // JIKA API LANGSUNG KIRIM GAMBAR
    // ===============================
    if (contentType.startsWith("image/")) {
      return ctx.replyWithPhoto(
        { source: Buffer.from(res.data) },
        {
          caption: `📸 <b>Cecan ${country.toUpperCase()}</b>`,
          parse_mode: "HTML",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    }

    // ===============================
    // JIKA API KIRIM JSON
    // ===============================
    const json = JSON.parse(Buffer.from(res.data).toString("utf-8"));

    let imageUrl =
      json?.url ||
      (Array.isArray(json?.result)
        ? json.result[Math.floor(Math.random() * json.result.length)]
        : json?.result);

    if (!imageUrl || typeof imageUrl !== "string") {
      throw new Error("Invalid image URL");
    }

    const img = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30_000,
    });

    await ctx.replyWithPhoto(
      { source: Buffer.from(img.data) },
      {
        caption: `📸 <b>Cecan ${country.toUpperCase()}</b>`,
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ /cecan error:", err);

    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "⚠️ Gagal mengambil gambar."
        : "⚠️ Failed to fetch image.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
