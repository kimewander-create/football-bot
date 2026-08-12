const { handleScreenshot, approvePayment, rejectPayment } = require('./paymentHandler');
const { isAdmin } = require('../utils/helpers');
const { Payment } = require('../models');

const screenshotHandler = async (ctx, bot) => {
  await handleScreenshot(ctx, bot);
};

const approveHandler = async (ctx) => {
  const adminId = ctx.from.id.toString();
  if (!await isAdmin(adminId)) {
    return ctx.answerCbQuery('❌ Admin only');
  }

  const paymentId = parseInt(ctx.match[1]);
  const result = await approvePayment(ctx, paymentId, adminId);

  if (result.success) {
    await ctx.editMessageCaption(
      `✅ *APPROVED*\n\n${result.payment.amount} ETB added to player's wallet.`,
      { parse_mode: 'Markdown' }
    );
    await ctx.answerCbQuery('✅ Payment approved!');
  } else {
    await ctx.answerCbQuery('❌ Payment not found');
  }
};

const rejectHandler = async (ctx) => {
  const adminId = ctx.from.id.toString();
  if (!await isAdmin(adminId)) {
    return ctx.answerCbQuery('❌ Admin only');
  }

  await rejectPayment(ctx);
  await ctx.editMessageCaption(
    '❌ *REJECTED*\n\nPayment rejected. Player notified.',
    { parse_mode: 'Markdown' }
  );
  await ctx.answerCbQuery('❌ Payment rejected');
};

module.exports = {
  screenshotHandler,
  approveHandler,
  rejectHandler
};
