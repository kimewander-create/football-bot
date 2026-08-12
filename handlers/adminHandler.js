const { User, Match, Payment } = require('../models');
const { adminMenu } = require('../utils/menus');
const { isAdmin } = require('../utils/helpers');

const showAdminPanel = async (ctx) => {
  if (!await isAdmin(ctx.from.id.toString())) {
    return ctx.reply('❌ Admin only.');
  }
  await ctx.reply('👑 *Admin Panel*', { parse_mode: 'Markdown', ...adminMenu() });
};

const showPendingPayments = async (ctx) => {
  if (!await isAdmin(ctx.from.id.toString())) return ctx.reply('❌ Admin only.');
  const pending = await Payment.findPending();
  if (pending.length === 0) {
    return ctx.reply('✅ No pending payments.', adminMenu());
  }

  let msg = '💰 *Pending Payments*\n\n';
  for (const p of pending) {
    msg += `👤 ${p.firstName} ${p.lastName || ''}\n`;
    msg += `💰 ${p.amount} ETB\n`;
    msg += `📅 ${p.createdAt}\n`;
    msg += `🆔 ${p.id}\n\n`;
  }
  await ctx.reply(msg, { parse_mode: 'Markdown', ...adminMenu() });
};

const showAllPlayers = async (ctx) => {
  if (!await isAdmin(ctx.from.id.toString())) return ctx.reply('❌ Admin only.');
  const players = await User.getAll();
  if (players.length === 0) return ctx.reply('👥 No players.', adminMenu());

  let msg = '👥 *All Players*\n\n';
  for (const p of players) {
    const admin = p.isAdmin ? '👑 ' : '';
    msg += `${admin}${p.firstName} - ${p.balance} ETB (${p.matchesPlayed} matches)\n`;
  }
  await ctx.reply(msg, { parse_mode: 'Markdown', ...adminMenu() });
};

const showReports = async (ctx) => {
  if (!await isAdmin(ctx.from.id.toString())) return ctx.reply('❌ Admin only.');
  const players = await User.getAll();
  const matches = await Match.findAll();
  const totalBal = players.reduce((s, p) => s + p.balance, 0);

  await ctx.reply(
    `📊 *Reports*\n\n` +
    `👥 Players: ${players.length}\n` +
    `📅 Matches: ${matches.length}\n` +
    `💰 Total Balance: ${totalBal} ETB`,
    { parse_mode: 'Markdown', ...adminMenu() }
  );
};

const addBalanceManual = async (ctx, targetId, amount) => {
  if (!await isAdmin(ctx.from.id.toString())) return ctx.reply('❌ Admin only.');
  await User.updateBalance(targetId, parseInt(amount));
  const target = await User.findByTelegramId(targetId);
  return ctx.reply(
    `✅ Added ${amount} ETB to ${target?.firstName || targetId}\n` +
    `New balance: ${target?.balance || 0} ETB`,
    adminMenu()
  );
};

module.exports = {
  showAdminPanel,
  showPendingPayments,
  showAllPlayers,
  showReports,
  addBalanceManual
};
