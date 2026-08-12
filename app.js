require('dotenv').config();
const fs = require('fs');
const express = require('express');
const { Telegraf } = require('telegraf');
const { initDB } = require('./config/database');

// ============================================
// EXPRESS WEB SERVER (For cPanel)
// ============================================
const webApp = express();
const PORT = process.env.PORT || 3000;

webApp.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>⚽ Football Bot</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>⚽ Football Attendance Bot</h1>
        <p>Status: <span style="color: green;">✅ Running</span></p>
        <p>Bot is active and working!</p>
      </body>
    </html>
  `);
});

// ============================================
// BOT INIT
// ============================================
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./screenshots')) fs.mkdirSync('./screenshots');

// Import handlers
const { startHandler, contactHandler } = require('./handlers/startHandler');
const { menuHandler, showMatches, showBalance, showHistory, showHelp } = require('./handlers/menuHandler');
const { startMatchCreation, handleMatchCreation, handleDateSelection, handleTimeSelection, matchData } = require('./handlers/matchHandler');
const { promptPayment } = require('./handlers/paymentHandler');
const { screenshotHandler, approveHandler, rejectHandler } = require('./handlers/screenshotHandler');
const { showAdminPanel, showPendingPayments, showAllPlayers, showReports } = require('./handlers/adminHandler');

// Init bot
const bot = new Telegraf(process.env.BOT_TOKEN);
module.exports.bot = bot;
module.exports.webApp = webApp;

// Init DB
initDB().then(() => console.log('✅ Database ready'));

// ============================================
// COMMANDS
// ============================================
bot.start(startHandler);

// Contact Handler
bot.on('contact', contactHandler);

// ============================================
// TEXT HANDLERS
// ============================================
bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  const userId = ctx.from.id.toString();

  const user = await require('./models/User').findByTelegramId(userId);
  if (!user) return;

  if (text === '⚽ Upcoming Matches') return showMatches(ctx);
  if (text === '💰 Balance') return showBalance(ctx);
  if (text === '📸 Send Payment') return promptPayment(ctx);
  if (text === '📋 History') return showHistory(ctx);
  if (text === '👑 Admin Panel') return showAdminPanel(ctx);
  if (text === '📅 Create Match') return startMatchCreation(ctx);
  if (text === '💰 Pending Payments') return showPendingPayments(ctx);
  if (text === '👥 All Players') return showAllPlayers(ctx);
  if (text === '📊 Reports') return showReports(ctx);
  if (text === 'ℹ️ Help') return showHelp(ctx);
  if (text === '🔙 Back to Menu') return ctx.reply('🏠 Back to menu', require('./utils/menus').mainMenu());

  if (matchData[userId]) return handleMatchCreation(ctx, text);

  const balPattern = /^addbalance\s+(\d+)\s+(\d+)$/;
  const balMatch = text.match(balPattern);
  if (balMatch) {
    const { addBalanceManual } = require('./handlers/adminHandler');
    return addBalanceManual(ctx, balMatch[1], balMatch[2]);
  }
});

// ============================================
// SCREENSHOTS
// ============================================
bot.on('photo', (ctx) => screenshotHandler(ctx, bot));

// ============================================
// CALLBACKS
// ============================================
bot.action(/^approve_(\d+)$/, approveHandler);
bot.action(/^reject_(\d+)$/, rejectHandler);
bot.action(/^match_date_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const date = ctx.match[1];
  await handleDateSelection(ctx, date);
});
bot.action(/^match_time_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const time = ctx.match[1];
  await handleTimeSelection(ctx, time);
});
// Date callbacks
bot.action(/^match_date_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const date = ctx.match[1];
  await handleDateSelection(ctx, date);
});

// Time callbacks
bot.action(/^match_time_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const time = ctx.match[1];
  await handleTimeSelection(ctx, time);
});
// ============================================
// EDIT ACTIONS (Admin)
// ============================================
bot.action(/^edit_amount_(\d+)$/, async (ctx) => {
  const paymentId = parseInt(ctx.match[1]);
  const { pendingEdits } = require('./handlers/paymentHandler');
  const data = pendingEdits[paymentId];
  if (!data) return ctx.answerCbQuery('❌ Payment not found');

  await ctx.answerCbQuery();
  await ctx.reply(
    `✏️ *Edit Amount*\n\n` +
    `Current: ${data.amount} ETB\n\n` +
    `Send the correct amount in ETB:\n` +
    `Example: \`200\``,
    { parse_mode: 'Markdown' }
  );
  
  pendingEdits[paymentId].editing = 'amount';
});

bot.action(/^edit_date_(\d+)$/, async (ctx) => {
  const paymentId = parseInt(ctx.match[1]);
  const { pendingEdits } = require('./handlers/paymentHandler');
  const data = pendingEdits[paymentId];
  if (!data) return ctx.answerCbQuery('❌ Payment not found');

  await ctx.answerCbQuery();
  await ctx.reply(
    `✏️ *Edit Date*\n\n` +
    `Current: ${data.date}\n\n` +
    `Send the correct date (YYYY-MM-DD):\n` +
    `Example: \`2026-08-03\``,
    { parse_mode: 'Markdown' }
  );
  
  pendingEdits[paymentId].editing = 'date';
});

bot.action(/^edit_sender_(\d+)$/, async (ctx) => {
  const paymentId = parseInt(ctx.match[1]);
  const { pendingEdits } = require('./handlers/paymentHandler');
  const data = pendingEdits[paymentId];
  if (!data) return ctx.answerCbQuery('❌ Payment not found');

  await ctx.answerCbQuery();
  await ctx.reply(
    `✏️ *Edit Sender Name*\n\n` +
    `Current: ${data.sender}\n\n` +
    `Send the correct sender name:`,
    { parse_mode: 'Markdown' }
  );
  
  pendingEdits[paymentId].editing = 'sender';
});

bot.action(/^edit_ref_(\d+)$/, async (ctx) => {
  const paymentId = parseInt(ctx.match[1]);
  const { pendingEdits } = require('./handlers/paymentHandler');
  const data = pendingEdits[paymentId];
  if (!data) return ctx.answerCbQuery('❌ Payment not found');

  await ctx.answerCbQuery();
  await ctx.reply(
    `✏️ *Edit Reference*\n\n` +
    `Current: ${data.reference}\n\n` +
    `Send the correct reference/transaction ID:`,
    { parse_mode: 'Markdown' }
  );
  
  pendingEdits[paymentId].editing = 'ref';
});

// ============================================
// START WEB SERVER + BOT
// ============================================
const server = webApp.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log('⚽ Football Bot is LIVE!');
});

bot.launch()
  .then(() => console.log('✅ Bot connected to Telegram'))
  .catch(err => console.error('❌ Bot failed:', err));

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});

module.exports = bot;
