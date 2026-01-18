const axios = require("axios");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    // Loading
    const loading = await ctx.reply(
      isIndo
        ? "🌏 Mengambil data gempa terbaru..."
        : "🌏 Fetching latest earthquake data...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // Fetch data gempa
    const res = await axios.get(
      "https://endpoint-hub.up.railway.app/api/tools/shakemap",
      { timeout: 30_000 }
    );

    const json = res.data;
    if (!json?.ok || !json.data) {
      throw new Error("Invalid API response");
    }

    const d = json.data;

    // Fetch gambar shakemap sebagai arraybuffer
    const imgRes = await axios.get(d.shakemap, {
      responseType: "arraybuffer",
      timeout: 30_000,
    });

    const imageBuffer = Buffer.from(imgRes.data);

    const caption = `
🌍 <b>Info Gempa Terkini</b>

📅 <b>Tanggal:</b> ${d.tanggal}
🕒 <b>Waktu:</b> ${d.jam}

💥 <b>Magnitudo:</b> ${d.magnitude}
📉 <b>Kedalaman:</b> ${d.kedalaman}

📍 <b>Wilayah:</b>
${d.wilayah}

📐 <b>Koordinat:</b>
${d.coordinates.latitude}, ${d.coordinates.longitude}

📢 <b>Dirasakan:</b>
${d.dirasakan || "-"}
`.trim();

    // Hapus loading
    if (loading?.message_id) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loading.message_id)
        .catch(() => {});
    }

    // Kirim gambar via buffer
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ /shakemap error:", err);

    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "⚠️ Gagal mengambil data gempa."
        : "⚠️ Failed to fetch earthquake data.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
