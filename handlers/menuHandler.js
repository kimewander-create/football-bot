const { User, Match, Attendance } = require('../models');
const { mainMenu, adminMenu } = require('../utils/menus');
const { isAdmin } = require('../utils/helpers');

const menuHandler = async (ctx) => {
  const userId = ctx.from.id.toString();
  const user = await User.findByTelegramId(userId);
  if (!user) return ctx.reply('❌ Register first with /start');
  const admin = await isAdmin(userId);
  await ctx.reply('🏠 *Main Menu*', { parse_mode: 'Markdown', ...mainMenu(admin) });
};

const showMatches = async (ctx) => {
  const matches = await Match.findUpcoming();
  if (matches.length === 0) {
    return ctx.reply('⚽ No upcoming matches.', mainMenu());
  }
  let msg = '⚽ *Upcoming Matches*\n\n';
  for (const m of matches) {
    msg += `📅 ${m.matchDate} ${m.matchTime}\n📍 ${m.venue}\n💰 ${m.fee} ETB\n\n`;
  }
  await ctx.reply(msg, { parse_mode: 'Markdown', ...mainMenu() });
};

const showBalance = async (ctx) => {
  const user = await User.findByTelegramId(ctx.from.id.toString());
  await ctx.reply(
    `💰 *Balance*\n\n` +
    `Balance: ${user.balance} ETB\n` +
    `Deposited: ${user.totalDeposited} ETB\n` +
    `Spent: ${user.totalSpent} ETB\n` +
    `Matches: ${user.matchesPlayed}`,
    { parse_mode: 'Markdown', ...mainMenu() }
  );
};

const showHistory = async (ctx) => {
  const userId = ctx.from.id.toString();
  const history = await Attendance.findByUser(userId);
  if (history.length === 0) {
    return ctx.reply('📋 No match history.', mainMenu());
  }
  let msg = '📋 *Match History*\n\n';
  for (const h of history.slice(0, 10)) {
    msg += `📅 ${h.matchDate} ${h.matchTime} - ${h.venue}\n`;
  }
  await ctx.reply(msg, { parse_mode: 'Markdown', ...mainMenu() });
};

const showHelp = async (ctx) => {
  await ctx.reply(
    'ℹ️ *Help*\n\n' +
    '💰 Pay admin (Cash/Telebirr)\n' +
    '📸 Send screenshot to bot\n' +
    '✅ Admin approves → Balance added\n' +
    '⚽ Confirm match → Auto-deduct\n\n' +
    '*Buttons:*\n' +
    '⚽ Matches - View upcoming\n' +
    '💰 Balance - Check wallet\n' +
    '📸 Pay - Send screenshot\n' +
    '📋 History - Your matches',
    { parse_mode: 'Markdown', ...mainMenu() }
  );
};

module.exports = {
  menuHandler,
  showMatches,
  showBalance,
  showHistory,
  showHelp
};
