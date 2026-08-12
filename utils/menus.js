const { Markup } = require('telegraf');

// ============================================
// MAIN MENU BUTTONS (Reply Keyboard)
// ============================================
const mainMenu = (isAdmin = false) => ({
  reply_markup: {
    keyboard: [
      ['⚽ Upcoming Matches', '💰 Balance'],
      ['📸 Send Payment', '📋 History'],
      isAdmin ? ['👑 Admin Panel'] : [],
      ['ℹ️ Help']
    ].filter(row => row.length > 0),
    resize_keyboard: true,
    persistent: true
  }
});

// ============================================
// ADMIN MENU
// ============================================
const adminMenu = () => ({
  reply_markup: {
    keyboard: [
      ['📅 Create Match', '💰 Pending Payments'],
      ['👥 All Players', '📊 Reports'],
      ['🔙 Back to Menu']
    ],
    resize_keyboard: true,
    persistent: true
  }
});

// ============================================
// CONTACT SHARING BUTTON (For Registration)
// ============================================
const contactButton = () => ({
  reply_markup: {
    keyboard: [
      [{ text: '📱 Share Phone Number', request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }
});

// ============================================
// PAYMENT APPROVAL BUTTONS (Inline)
// ============================================
const approveButtons = (paymentId) => ({
  reply_markup: {
    inline_keyboard: [
      [{ text: '✅ Approve', callback_data: `approve_${paymentId}` }],
      [{ text: '❌ Reject', callback_data: `reject_${paymentId}` }]
    ]
  }
});

// ============================================
// DATE & TIME PICKER (Inline Calendar)
// ============================================
const datePicker = (action) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Simple date picker with quick options
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📅 Today', callback_data: `${action}_date_${year}-${month}-${day}` },
          { text: '📅 Tomorrow', callback_data: `${action}_date_${year}-${month}-${String(now.getDate() + 1).padStart(2, '0')}` }
        ],
        [
          { text: '📅 This Saturday', callback_data: `${action}_date_${getNextSaturday()}` },
          { text: '📅 Next Saturday', callback_data: `${action}_date_${getNextSaturday(7)}` }
        ],
        [
          { text: '📅 Custom Date', callback_data: `${action}_custom_date` }
        ]
      ]
    }
  };
};

const getNextSaturday = (daysToAdd = 0) => {
  const now = new Date();
  const saturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
  saturday.setDate(now.getDate() + daysUntilSaturday + daysToAdd);
  const year = saturday.getFullYear();
  const month = String(saturday.getMonth() + 1).padStart(2, '0');
  const day = String(saturday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================
// TIME PICKER
// ============================================
const timePicker = (action) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🕐 4:00 PM', callback_data: `${action}_time_16:00` },
        { text: '🕐 5:00 PM', callback_data: `${action}_time_17:00` }
      ],
      [
        { text: '🕐 6:00 PM', callback_data: `${action}_time_18:00` },
        { text: '🕐 7:00 PM', callback_data: `${action}_time_19:00` }
      ],
      [
        { text: '🕐 Custom Time', callback_data: `${action}_custom_time` }
      ]
    ]
  }
});

module.exports = {
  mainMenu,
  adminMenu,
  contactButton,
  approveButtons,
  datePicker,
  timePicker
};
