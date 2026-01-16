const fetch = require("node-fetch");
const { loadUser, saveUser } = require("../../handler");
const { downloadWithProgress } = require("../../lib/loading");

module.exports = async (ctx) => {
  try {
    const userLang = ctx.from.language_code || "en";
    const isIndo = userLang.startsWith("id");

    // 🔹 Load user & cek limit
    const user = loadUser(ctx.from.id) || { limit: 5 };
    if (user.limit <= 0) {
      return ctx.reply(
        isIndo
          ? "🚫 Limit kamu sudah habis. Tunggu 24 jam untuk reset."
          : "🚫 Your daily limit has run out. Please wait 24 hours for reset.",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Ambil input URL
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!input) {
      return ctx.reply(
        isIndo
          ? "💡 Gunakan format: /instagram <url>\nContoh: /instagram https://www.instagram.com/reel/***/"
          : "💡 Use format: /instagram <url>\nExample: /instagram https://www.instagram.com/reel/***/",
        { reply_to_message_id: ctx.message?.message_id }
      );
    }

    // 🔹 Pesan awal (akan di-edit terus)
    const mainMsg = await ctx.reply(
      isIndo ? "⏳ Mengambil data Instagram..." : "⏳ Fetching Instagram data...",
      { reply_to_message_id: ctx.message?.message_id }
    );

    // 🔹 Kurangi limit user
    user.limit -= 1;
    saveUser(ctx.from.id, user);

    // 🔹 Ambil data dari API
    const apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(input)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.status || !Array.isArray(data?.data) || data.data.length === 0) {
      throw new Error("Data kosong dari API");
    }

    const medias = data.data;
    const total = medias.length;
    let sentCount = 0;
    const photoGroup = [];

    // 🔹 Loop semua media
    for (let i = 0; i < medias.length; i++) {
      const item = medias[i];
      const isLast = i === medias.length - 1;

      try {
        if (item.type === "video" || item.url?.includes(".mp4")) {
          // === Edit pesan jadi status download ===
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            mainMsg.message_id,
            undefined,
            isIndo ? "📥 Mengunduh video..." : "📥 Downloading video..."
          );

          const videoBuffer = await downloadWithProgress(
            ctx,
            mainMsg,
            item.url,
            isIndo ? "📥 Mengunduh video..." : "📥 Downloading video..."
          );

          const caption = isLast
            ? `✅ ${isIndo ? "Selesai mengirim" : "Done sending"} ${total} ${
                isIndo ? "media." : "media."
              }`
            : undefined;

          await ctx.replyWithVideo(
            { source: videoBuffer },
            {
              caption,
              reply_to_message_id: ctx.message?.message_id,
            }
          );

          // Edit pesan utama menjadi "✅ Selesai"
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            mainMsg.message_id,
            undefined,
            isIndo
              ? "✅ Video berhasil diunduh dan dikirim!"
              : "✅ Video successfully downloaded and sent!"
          );

          sentCount++;
        } else if (
          item.type === "image" ||
          item.thumbnail ||
          item.url?.match(/\.(jpg|jpeg|png)/)
        ) {
          // === Kumpulkan gambar untuk album ===
          photoGroup.push({
            type: "photo",
            media: item.url || item.thumbnail,
            caption: undefined,
          });
          sentCount++;
        }
      } catch (e) {
        console.warn("⚠️ Gagal kirim salah satu media:", e.message);
      }
    }

    // 🔹 Kirim album foto
    if (photoGroup.length > 1) {
      photoGroup[photoGroup.length - 1].caption = `✅ ${
        isIndo ? "Selesai mengirim" : "Done sending"
      } ${sentCount} ${isIndo ? "dari" : "of"} ${total} ${
        isIndo ? "media." : "media."
      }`;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        mainMsg.message_id,
        undefined,
        isIndo
          ? "📷 Mengirim foto ke Telegram..."
          : "📷 Sending photos to Telegram..."
      );

      try {
        await ctx.telegram.sendMediaGroup(ctx.chat.id, photoGroup, {
          reply_to_message_id: ctx.message?.message_id,
        });

        await ctx.telegram.editMessageText(
          ctx.chat.id,
          mainMsg.message_id,
          undefined,
          isIndo
            ? "✅ Semua foto berhasil dikirim!"
            : "✅ All photos sent successfully!"
        );
      } catch (err) {
        console.warn("⚠️ Gagal kirim album:", err.message);
      }
    } else if (photoGroup.length === 1) {
      photoGroup[0].caption = `✅ ${
        isIndo ? "Selesai mengirim" : "Done sending"
      } ${total} ${isIndo ? "media." : "media."}`;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        mainMsg.message_id,
        undefined,
        isIndo ? "📸 Mengirim foto..." : "📸 Sending photo..."
      );

      await ctx.replyWithPhoto(photoGroup[0].media, {
        caption: photoGroup[0].caption,
        reply_to_message_id: ctx.message?.message_id,
      });

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        mainMsg.message_id,
        undefined,
        isIndo
          ? "✅ Foto berhasil dikirim!"
          : "✅ Photo successfully sent!"
      );
    }
  } catch (err) {
    console.warn("⚠️ Error utama:", err.message);
    await ctx.reply(
      (ctx.from.language_code || "en").startsWith("id")
        ? "⚠️ Gagal memproses konten Instagram. Coba lagi nanti."
        : "⚠️ Failed to process Instagram content. Please try again later.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};
