const { Payment, User, Match } = require('../models');
const { mainMenu } = require('../utils/menus');
const screenshotService = require('../services/screenshotService');
const ImageAnalyzer = require('../services/imageAnalyzer');

const pendingEdits = {};

const promptPayment = async (ctx) => {
  const matches = await Match.findUpcoming();
  const match = matches && matches.length > 0 ? matches[0] : null;
  const matchFee = match ? match.fee : parseInt(process.env.MATCH_FEE) || 200;

  await ctx.reply(
    `📸 *Send Payment*\n\n` +
    `Send a screenshot of your payment (Telebirr/CBE).\n` +
    `💰 Match Fee: ${matchFee} ETB\n` +
    `📅 Match: ${match ? `${match.matchDate} ${match.matchTime}` : '⚠️ No match scheduled'}\n\n` +
    'The bot will try to auto-detect details.\n' +
    'Admin will review and confirm.',
    { parse_mode: 'Markdown' }
  );
};

const handleScreenshot = async (ctx, bot) => {
  const userId = ctx.from.id.toString();
  const user = await User.findByTelegramId(userId);
  if (!user) return ctx.reply('❌ Register first with /start');

  const matches = await Match.findUpcoming();
  const match = matches && matches.length > 0 ? matches[0] : null;
  const matchFee = match ? match.fee : parseInt(process.env.MATCH_FEE) || 200;

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file = await ctx.telegram.getFile(photo.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

  const response = await fetch(fileUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  const saved = await screenshotService.saveScreenshot(buffer, userId);
  if (!saved.success) return ctx.reply('❌ Failed to save screenshot.');

  const analysis = await ImageAnalyzer.analyze(saved.path);
  const finalAmount = analysis.scraped?.amount || matchFee;

  const scrapedDate = analysis.scraped?.date || 'Auto-detected';
  const scrapedSender = analysis.scraped?.sender || 'Auto-detected';
  const scrapedRef = analysis.scraped?.reference || 'Auto-detected';

  // ✅ Create payment and get ID
  const paymentResult = await Payment.create({
    userId: userId,
    matchId: match ? match.id : null,
    amount: finalAmount,
    paymentType: match ? 'match' : 'deposit',
    method: 'telebirr',
    screenshotPath: saved.path || '',
    screenshotFileId: photo.file_id || '',
    scrapedData: JSON.stringify(analysis.scraped || {})
  });

  const paymentId = paymentResult.id;
  console.log('📦 Payment ID from create:', paymentId);

  if (!paymentId) {
    return ctx.reply('❌ Failed to create payment record. Please try again.');
  }

  await ctx.reply(
    `⏳ *Payment Received!*\n\n` +
    `💰 Amount: ${finalAmount} ETB\n` +
    `📅 Date: ${scrapedDate}\n` +
    `👤 Sender: ${scrapedSender}\n\n` +
    `🆔 Payment ID: ${paymentId}\n\n` +
    'Waiting for admin approval...',
    { parse_mode: 'Markdown', ...mainMenu() }
  );

  pendingEdits[paymentId] = {
    amount: finalAmount,
    date: scrapedDate,
    sender: scrapedSender,
    reference: scrapedRef,
    matchFee: matchFee,
    matchId: match ? match.id : null,
    userId: userId,
    userName: user.firstName,
    screenshotFileId: photo.file_id
  };

  // Notify admins
  const adminIds = (process.env.ADMIN_IDS || '').split(',').filter(id => id);
  for (const adminId of adminIds) {
    try {
      await bot.telegram.sendPhoto(adminId, photo.file_id, {
        caption: 
          `📸 *Payment Review*\n\n` +
          `👤 Player: ${user.firstName} ${user.lastName || ''}\n` +
          `📱 Phone: ${user.phoneNumber || 'N/A'}\n` +
          `📅 Match: ${match ? `${match.matchDate} ${match.matchTime}` : '⚠️ No match scheduled'}\n` +
          `💰 Match Fee: ${matchFee} ETB\n` +
          `🆔 Payment ID: ${paymentId}\n\n` +
          `*📊 Scraped Data:*\n` +
          `┌─────────────────────────\n` +
          `│ 💰 Amount: ${finalAmount} ETB ${finalAmount !== matchFee ? '⚠️' : '✅'}\n` +
          `│ 📅 Date: ${scrapedDate}\n` +
          `│ 👤 Sender: ${scrapedSender}\n` +
          `│ 🆔 Ref: ${scrapedRef}\n` +
          `└─────────────────────────\n\n` +
          `*⚠️ If any data is wrong, use the buttons below to edit.*`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✏️ Edit Amount', callback_data: `edit_amount_${paymentId}` }],
            [{ text: '✏️ Edit Date', callback_data: `edit_date_${paymentId}` }],
            [{ text: '✏️ Edit Sender', callback_data: `edit_sender_${paymentId}` }],
            [{ text: '✏️ Edit Reference', callback_data: `edit_ref_${paymentId}` }],
            [{ text: '✅ Approve & Add Balance', callback_data: `approve_${paymentId}` }],
            [{ text: '❌ Reject Payment', callback_data: `reject_${paymentId}` }]
          ]
        }
      });
    } catch (e) {
      console.error('Failed to notify admin:', e.message);
    }
  }
};

// ============================================
// APPROVE
// ============================================
const approvePayment = async (ctx, paymentId, adminId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) return { success: false, message: 'Payment not found' };

  const editData = pendingEdits[paymentId];
  const finalAmount = editData?.amount || payment.amount;

  await User.updateBalance(payment.userId, finalAmount);
  await Payment.verify(paymentId, adminId);

  const user = await User.findByTelegramId(payment.userId);
  await ctx.telegram.sendMessage(
    payment.userId,
    `✅ *Payment Verified!*\n\n` +
    `${finalAmount} ETB added to your wallet.\n` +
    `New balance: ${user?.balance || 0} ETB\n\n` +
    `You can now confirm matches! ⚽`,
    { parse_mode: 'Markdown' }
  );

  delete pendingEdits[paymentId];

  return { success: true, payment, amount: finalAmount };
};

const rejectPayment = async (ctx, paymentId) => {
  await Payment.reject(paymentId, 'Rejected by admin');
  delete pendingEdits[paymentId];

  const payment = await Payment.findById(paymentId);
  if (payment) {
    await ctx.telegram.sendMessage(
      payment.userId,
      `❌ *Payment Rejected*\n\n` +
      `Please send a clear screenshot of the payment.`,
      { parse_mode: 'Markdown' }
    );
  }

  return { success: true };
};

module.exports = {
  promptPayment,
  handleScreenshot,
  approvePayment,
  rejectPayment,
  pendingEdits
};
