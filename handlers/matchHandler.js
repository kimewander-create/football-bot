const { Match, User, Attendance } = require('../models');
const { adminMenu, datePicker, timePicker } = require('../utils/menus');
const { isAdmin, parseDate, parseTime, formatDate } = require('../utils/helpers');

// Store temporary match data
const matchData = {};

const startMatchCreation = async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!await isAdmin(userId)) return ctx.reply('❌ Admin only.');
  
  matchData[userId] = { step: 'date' };
  await ctx.reply(
    '📅 *Create Match - Step 1/4*\n\n' +
    'Select or type the match date:\n\n' +
    '📌 *Quick Options:*\n' +
    '• Click "This Saturday" → 🔄 Auto-calculates\n' +
    '• Click "Next Saturday" → 🔄 Auto-calculates\n' +
    '• Click "Today" → 📅 Today\'s date\n' +
    '• Click "Tomorrow" → 📅 Tomorrow\'s date\n\n' +
    '✏️ *Or type a custom date:*\n' +
    '• `Aug 10` or `10 Aug`\n' +
    '• `today`, `tomorrow`, `sat`\n' +
    '• `10` (10th of current month)\n' +
    '• `2026-08-10` (full format)',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📅 Today', callback_data: 'match_date_today' }],
          [{ text: '📅 Tomorrow', callback_data: 'match_date_tomorrow' }],
          [{ text: '📅 This Saturday', callback_data: 'match_date_this_sat' }],
          [{ text: '📅 Next Saturday', callback_data: 'match_date_next_sat' }],
          [{ text: '✏️ Custom Date', callback_data: 'match_date_custom' }]
        ]
      }
    }
  );
};

const handleDateSelection = async (ctx, dateInput) => {
  const userId = ctx.from.id.toString();
  const data = matchData[userId];
  if (!data) return;

  let parsedDate;

  if (dateInput === 'custom') {
    await ctx.reply(
      '✏️ *Enter Custom Date*\n\n' +
      'Type a date:\n' +
      '• `Aug 10` or `10 Aug`\n' +
      '• `today`, `tomorrow`, `sat`\n' +
      '• `10` (10th of current month)\n' +
      '• `2026-08-10`',
      { parse_mode: 'Markdown' }
    );
    data.step = 'custom_date';
    return;
  }

  parsedDate = parseDate(dateInput);
  
  if (!parsedDate) {
    await ctx.reply('❌ Invalid date format. Try again or use the buttons.');
    return;
  }

  data.matchDate = parsedDate;
  data.step = 'time';
  await ctx.reply(
    `✅ *Date set:* ${parsedDate}\n\n` +
    '📅 *Create Match - Step 2/4*\n\n' +
    'Select or type the match time:\n\n' +
    '📌 *Quick Options:*\n' +
    '• Click a time button → ⏰ Auto-sets\n\n' +
    '✏️ *Or type a custom time:*\n' +
    '• `4pm` or `4:30pm`\n' +
    '• `16:00`\n' +
    '• `4` (assumes PM)\n' +
    '• `noon`, `midnight`',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🕐 4 PM', callback_data: 'match_time_4pm' }],
          [{ text: '🕐 5 PM', callback_data: 'match_time_5pm' }],
          [{ text: '🕐 6 PM', callback_data: 'match_time_6pm' }],
          [{ text: '🕐 7 PM', callback_data: 'match_time_7pm' }],
          [{ text: '🕐 8 PM', callback_data: 'match_time_8pm' }],
          [{ text: '✏️ Custom Time', callback_data: 'match_time_custom' }]
        ]
      }
    }
  );
};

const handleTimeSelection = async (ctx, timeInput) => {
  const userId = ctx.from.id.toString();
  const data = matchData[userId];
  if (!data) return;

  let parsedTime;

  if (timeInput === 'custom') {
    await ctx.reply(
      '✏️ *Enter Custom Time*\n\n' +
      'Type a time:\n' +
      '• `4pm` or `4:30pm`\n' +
      '• `16:00`\n' +
      '• `4` (assumes PM)\n' +
      '• `noon`, `midnight`',
      { parse_mode: 'Markdown' }
    );
    data.step = 'custom_time';
    return;
  }

  // Parse quick time buttons
  const timeMap = {
    '4pm': '16:00', '5pm': '17:00', '6pm': '18:00',
    '7pm': '19:00', '8pm': '20:00'
  };
  
  parsedTime = timeMap[timeInput] || parseTime(timeInput);

  if (!parsedTime) {
    await ctx.reply('❌ Invalid time format. Try again or use the buttons.');
    return;
  }

  data.matchTime = parsedTime;
  data.step = 'venue';
  await ctx.reply(
    `✅ *Time set:* ${parsedTime}\n\n` +
    '📅 *Create Match - Step 3/4*\n\n' +
    'Send the venue name:\n' +
    'Example: `City Stadium`',
    { parse_mode: 'Markdown' }
  );
};

const handleMatchCreation = async (ctx, text) => {
  const userId = ctx.from.id.toString();
  const data = matchData[userId];
  if (!data) return;
  
  if (data.step === 'custom_date') {
    const parsedDate = parseDate(text);
    if (!parsedDate) {
      return ctx.reply('❌ Invalid date. Use: `Aug 10`, `today`, `sat`, or `2026-08-10`');
    }
    data.matchDate = parsedDate;
    data.step = 'time';
    await ctx.reply(
      `✅ *Date set:* ${parsedDate}\n\n` +
      '📅 *Create Match - Step 2/4*\n\n' +
      'Select or type the match time:\n\n' +
      '📌 *Quick Options:*\n' +
      '• Click a time button → ⏰ Auto-sets\n\n' +
      '✏️ *Or type a custom time:*\n' +
      '• `4pm` or `4:30pm`\n' +
      '• `16:00`\n' +
      '• `4` (assumes PM)\n' +
      '• `noon`, `midnight`',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🕐 4 PM', callback_data: 'match_time_4pm' }],
            [{ text: '🕐 5 PM', callback_data: 'match_time_5pm' }],
            [{ text: '🕐 6 PM', callback_data: 'match_time_6pm' }],
            [{ text: '🕐 7 PM', callback_data: 'match_time_7pm' }],
            [{ text: '🕐 8 PM', callback_data: 'match_time_8pm' }],
            [{ text: '✏️ Custom Time', callback_data: 'match_time_custom' }]
          ]
        }
      }
    );
    
  } else if (data.step === 'custom_time') {
    const parsedTime = parseTime(text);
    if (!parsedTime) {
      return ctx.reply('❌ Invalid time. Use: `4pm`, `16:00`, `noon`, or `4`');
    }
    data.matchTime = parsedTime;
    data.step = 'venue';
    await ctx.reply(
      `✅ *Time set:* ${parsedTime}\n\n` +
      '📅 *Create Match - Step 3/4*\n\n' +
      'Send the venue name:\n' +
      'Example: `City Stadium`',
      { parse_mode: 'Markdown' }
    );
    
  } else if (data.step === 'venue') {
    data.venue = text;
    data.step = 'fee';
    await ctx.reply(
      '📅 *Create Match - Step 4/4*\n\n' +
      'Send the match fee (in ETB):\n' +
      'Example: `200`',
      { parse_mode: 'Markdown' }
    );
    
  } else if (data.step === 'fee') {
    const fee = parseInt(text);
    if (isNaN(fee) || fee <= 0) {
      return ctx.reply('❌ Invalid fee. Send a number like: 200');
    }
    
    await Match.create({
      matchDate: data.matchDate,
      matchTime: data.matchTime,
      venue: data.venue,
      fee: fee,
      createdBy: userId
    });
    
    delete matchData[userId];
    
    await ctx.reply(
      `✅ *Match Created!*\n\n` +
      `📅 ${data.matchDate} ${data.matchTime}\n` +
      `📍 ${data.venue}\n` +
      `💰 ${fee} ETB\n\n` +
      `Players will be notified!`,
      { parse_mode: 'Markdown', ...adminMenu() }
    );
    
    if (process.env.GROUP_ID) {
      try {
        const bot = require('../app').bot;
        await bot.telegram.sendMessage(
          process.env.GROUP_ID,
          `⚽ *New Match!*\n\n📅 ${data.matchDate} ${data.matchTime}\n📍 ${data.venue}\n💰 ${fee} ETB\n\nUse /menu to confirm!`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    }
  }
};

const confirmMatch = async (ctx, matchId) => {
  const userId = ctx.from.id.toString();
  const user = await User.findByTelegramId(userId);
  if (!user) return ctx.reply('❌ Register first');

  const match = await Match.findById(matchId);
  if (!match) return ctx.reply('❌ Match not found');
  if (user.balance < match.fee) {
    return ctx.reply(
      `⚠️ *Insufficient Balance*\n\nNeed: ${match.fee} ETB\nYou have: ${user.balance} ETB`,
      { parse_mode: 'Markdown' }
    );
  }

  await User.updateBalance(userId, -match.fee);
  await User.update(userId, {
    totalSpent: (user.totalSpent || 0) + match.fee,
    matchesPlayed: (user.matchesPlayed || 0) + 1
  });

  await Attendance.create({
    userId,
    matchId: match.id,
    status: 'present',
    markedBy: userId
  });

  await ctx.reply(
    `✅ *Confirmed!*\n\n${match.fee} ETB deducted.\nRemaining: ${user.balance - match.fee} ETB`,
    { parse_mode: 'Markdown' }
  );
};

module.exports = {
  startMatchCreation,
  handleMatchCreation,
  handleDateSelection,
  handleTimeSelection,
  confirmMatch,
  matchData
};
