const axios = require("axios");

module.exports = async (ctx) => {
  try {
    const isIndo = (ctx.from?.language_code || "").startsWith("id");

    // Ambil query
    const text = ctx.message?.text || "";
    const query = text.split(" ").slice(1).join(" ").trim().toLowerCase();

    if (!query) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan: /cryptoinfo <symbol>\nContoh: /cryptoinfo btc"
          : "💡 Use: /cryptoinfo <symbol>\nExample: /cryptoinfo btc",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // Loading
    const loading = await ctx.reply(
      isIndo
        ? `📊 Mengambil data crypto <b>${query.toUpperCase()}</b>...`
        : `📊 Fetching crypto data <b>${query.toUpperCase()}</b>...`,
      {
        reply_to_message_id: ctx.message?.message_id,
        parse_mode: "HTML",
      }
    );

    // Fetch data crypto
    const res = await axios.get(
      "https://endpoint-hub.up.railway.app/api/tools/crypto",
      {
        params: { text: query },
        timeout: 30_000,
      }
    );

    const json = res.data;
    if (!json?.ok || !json.response?.status) {
      throw new Error("Invalid API response");
    }

    const r = json.response;

    // Fetch chart sebagai arraybuffer
    const chartRes = await axios.get(r.chart.url, {
      responseType: "arraybuffer",
      timeout: 30_000,
    });

    const chartBuffer = Buffer.from(chartRes.data);

    // Helper format angka
    const usd = (n) =>
      `$${Number(n).toLocaleString("en-US")}`;

    const changeIcon = r.price.change_24h >= 0 ? "📈" : "📉";

    const caption = `
🪙 <b>${query.toUpperCase()}</b> (${r.chart.range})

💲 <b>Price:</b> ${usd(r.price.value_usd)}
${changeIcon} <b>24h Change:</b> ${r.price.change_24h}%

🏦 <b>Market Cap:</b>
${usd(r.price.market_cap)}

📊 <b>24h High:</b> ${usd(r.extra.high_24h)}
📉 <b>24h Low:</b> ${usd(r.extra.low_24h)}

🔄 <b>Volume 24h:</b>
${usd(r.extra.total_volume)}

⏱️ <b>Updated:</b>
${new Date(r.timestamp).toLocaleString()}
`.trim();

    // Hapus loading
    if (loading?.message_id) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loading.message_id)
        .catch(() => {});
    }

    // Kirim chart
    await ctx.replyWithPhoto(
      { source: chartBuffer },
      {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id,
      }
    );
  } catch (err) {
    console.error("❌ /cryptoinfo error:", err);

    await ctx.reply(
      (ctx.from?.language_code || "").startsWith("id")
        ? "⚠️ Gagal mengambil data crypto."
        : "⚠️ Failed to fetch crypto data.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
