const { loadUser, saveUser } = require("../../handler");

module.exports = async (ctx) => {
  const isIndo = ctx.isIndo || (ctx.from?.language_code || "").startsWith("id");
  const user = loadUser(ctx.from.id, ctx.from.first_name);

  const message = isIndo
    ? `💎 Limit kamu tersisa *${user.limit}*`
    : `💎 Your remaining limit is *${user.limit}*`;

  ctx.reply(message, {
    parse_mode: "Markdown",
    reply_to_message_id: ctx.message?.message_id
  });
};
