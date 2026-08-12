const { User } = require('../models');
const { mainMenu, contactButton } = require('../utils/menus');
const { isAdmin } = require('../utils/helpers');

const startHandler = async (ctx) => {
  const userId = ctx.from.id.toString();
  const user = await User.findByTelegramId(userId);

  if (!user) {
    await ctx.reply(
      '⚽ *Welcome to Football Bot!*\n\n' +
      'Please share your phone number to register:',
      { 
        parse_mode: 'Markdown',
        ...contactButton()
      }
    );
  } else {
    const admin = await isAdmin(userId);
    await ctx.reply(
      `⚽ *Welcome back, ${user.firstName}!*\n\n` +
      `💰 Balance: ${user.balance} ETB\n` +
      `📊 Matches: ${user.matchesPlayed}`,
      { parse_mode: 'Markdown', ...mainMenu(admin) }
    );
  }
};

const contactHandler = async (ctx) => {
  const userId = ctx.from.id.toString();
  const user = await User.findByTelegramId(userId);
  
  // If already registered, ignore
  if (user) return;

  // Get contact from message
  const contact = ctx.message.contact;
  if (!contact) return;

  // Use the phone number from contact (remove +251 if present)
  let phoneNumber = contact.phone_number;
  if (phoneNumber.startsWith('+251')) {
    phoneNumber = phoneNumber.substring(4);
  }
  if (phoneNumber.startsWith('0')) {
    phoneNumber = phoneNumber;
  } else if (!phoneNumber.startsWith('09')) {
    phoneNumber = '0' + phoneNumber;
  }

  await User.create({
    telegramId: userId,
    firstName: ctx.from.first_name || '',
    lastName: ctx.from.last_name || '',
    username: ctx.from.username || '',
    phoneNumber: phoneNumber
  });

  const adminIds = (process.env.ADMIN_IDS || '').split(',');
  if (adminIds.includes(userId)) {
    await User.update(userId, { isAdmin: 1 });
  }

  const admin = await isAdmin(userId);
  await ctx.reply(
    '✅ *Registered!* Use the menu below:',
    { parse_mode: 'Markdown', ...mainMenu(admin) }
  );
};

module.exports = { startHandler, contactHandler };
