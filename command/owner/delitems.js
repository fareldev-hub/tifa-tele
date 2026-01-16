const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { bot_name, owner_id } = require("../../settings");

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

/**
 * Menghapus gambar dari ImgBB berdasarkan URL
 */
async function deleteFromImgBB(imageUrl) {
  try {
    // Ambil hash unik dari URL ImgBB
    const match = imageUrl.match(/\/([a-zA-Z0-9]+)\/[^/]+$/);
    if (!match) return false;
    const deleteHash = match[1];

    const res = await fetch(`https://api.imgbb.com/1/image/${deleteHash}?key=${IMGBB_API_KEY}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => ({}));
    if (json?.success) return true;

    console.log("⚠️ Gagal hapus gambar di ImgBB:", json);
    return false;
  } catch (err) {
    console.error("❌ Error deleteFromImgBB:", err);
    return false;
  }
}

module.exports = async (ctx) => {
  try {
    // 🔐 Hanya owner
    if (ctx.from.id !== owner_id)
      return ctx.reply("🚫 Hanya Owner yang bisa menghapus item!");

    // 📩 Hanya di chat pribadi
    if (ctx.chat.type !== "private")
      return ctx.reply("⚠️ Perintah ini hanya bisa digunakan di chat pribadi.");

    const text = ctx.message.text || "";
    const args = text.split(" ").slice(1);
    const itemId = args[0];

    const itemsPath = path.join(__dirname, "../../assets/purchase/items.json");

    if (!fs.existsSync(itemsPath)) {
      return ctx.reply("⚠️ Database item tidak ditemukan.");
    }

    let items;
    try {
      items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
    } catch {
      return ctx.reply("❌ Gagal membaca database item.");
    }

    // Jika tidak ada argumen, tampilkan semua ID item
    if (!itemId) {
      if (items.length === 0) {
        return ctx.reply("📦 Tidak ada item yang tersimpan saat ini.");
      }

      const listText = items
        .map(
          (i, idx) =>
            `${idx + 1}. <b>${i.name}</b>\n🆔 <code>${i.id}</code>\n💰 ${i.price}⭐️ | 📦 Stok: ${i.stock ?? "∞"}`
        )
        .join("\n\n");

      const message = `📋 <b>Daftar Item (${items.length})</b>\n\n${listText}\n\nGunakan perintah:\n<code>/delitems ID_ITEM</code>\nUntuk menghapus item tertentu.`;

      return ctx.reply(message, { parse_mode: "HTML", reply_to_message_id: ctx.message?.message_id });
    }

    // Jika ada argumen → hapus item
    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) {
      return ctx.reply(`❌ Item dengan ID <code>${itemId}</code> tidak ditemukan.`, {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message?.message_id
      });
    }

    const item = items[index];

    await ctx.reply(`🗑️ Menghapus item <b>${item.name}</b>...`, { parse_mode: "HTML",reply_to_message_id: ctx.message?.message_id });

    // Hapus gambar dari ImgBB
    const deletedImg = await deleteFromImgBB(item.image);

    // Hapus item dari database
    items.splice(index, 1);
    fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2));

    await ctx.replyWithPhoto(item.image, {
      caption: `✅ <b>Item Dihapus!</b>\n\n📦 <b>${item.name}</b>\n🆔 <code>${item.id}</code>\n${deletedImg}`,
      parse_mode: "HTML",
      reply_to_message_id: ctx.message?.message_id
    });

    console.log(`🗑️ Item ${item.name} (${item.id}) dihapus oleh ${ctx.from.first_name}`);
  } catch (err) {
    console.error("❌ Error di /delitems:", err);
    ctx.reply("❌ Terjadi kesalahan saat menghapus item.");
  }
};
