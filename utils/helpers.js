const { User } = require('../models');

const isAdmin = async (telegramId) => {
  const user = await User.findByTelegramId(telegramId);
  return user ? user.isAdmin === 1 : false;
};

// ============================================
// SMART DATE PARSER
// ============================================
const parseDate = (input) => {
  input = input.toLowerCase().trim();
  const now = new Date();
  
  // Today
  if (input === 'today') {
    return formatDate(now);
  }
  
  // Tomorrow
  if (input === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }
  
  // This Saturday
  if (input === 'this sat' || input === 'sat' || input === 'saturday') {
    const sat = new Date(now);
    const daysUntilSat = (6 - now.getDay() + 7) % 7;
    sat.setDate(sat.getDate() + daysUntilSat);
    return formatDate(sat);
  }
  
  // Next Saturday
  if (input === 'next sat' || input === 'next saturday') {
    const sat = new Date(now);
    const daysUntilSat = (6 - now.getDay() + 7) % 7 + 7;
    sat.setDate(sat.getDate() + daysUntilSat);
    return formatDate(sat);
  }
  
  // Aug 10 or 10 Aug
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  // Match "Aug 10" or "10 Aug"
  const monthDayMatch = input.match(/([a-z]{3})\s*(\d{1,2})|(\d{1,2})\s*([a-z]{3})/i);
  if (monthDayMatch) {
    let month, day;
    if (monthDayMatch[1]) {
      month = monthMap[monthDayMatch[1].toLowerCase()];
      day = parseInt(monthDayMatch[2]);
    } else {
      month = monthMap[monthDayMatch[4].toLowerCase()];
      day = parseInt(monthDayMatch[3]);
    }
    if (month !== undefined && day >= 1 && day <= 31) {
      const date = new Date(now.getFullYear(), month, day);
      return formatDate(date);
    }
  }
  
  // Match just a number (e.g., "10" → 10th of current month)
  const dayOnly = input.match(/^(\d{1,2})$/);
  if (dayOnly) {
    const day = parseInt(dayOnly[1]);
    if (day >= 1 && day <= 31) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      return formatDate(date);
    }
  }
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  
  return null;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================
// SMART TIME PARSER
// ============================================
const parseTime = (input) => {
  input = input.toLowerCase().trim();
  
  // 4pm → 16:00
  const pmMatch = input.match(/^(\d{1,2})(?::(\d{2}))?\s*pm$/);
  if (pmMatch) {
    let hour = parseInt(pmMatch[1]);
    const min = parseInt(pmMatch[2] || '00');
    if (hour !== 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  
  // 4am → 04:00
  const amMatch = input.match(/^(\d{1,2})(?::(\d{2}))?\s*am$/);
  if (amMatch) {
    let hour = parseInt(amMatch[1]);
    if (hour === 12) hour = 0;
    const min = parseInt(amMatch[2] || '00');
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  
  // 16:00
  if (/^\d{2}:\d{2}$/.test(input)) {
    return input;
  }
  
  // 4 → 16:00 (assumes PM for afternoon)
  const hourOnly = input.match(/^(\d{1,2})$/);
  if (hourOnly) {
    let hour = parseInt(hourOnly[1]);
    if (hour < 6) return `${String(hour).padStart(2, '0')}:00`; // 1-5 = AM
    if (hour < 12) return `${String(hour).padStart(2, '0')}:00`; // 6-11 = AM
    if (hour === 12) return '12:00'; // Noon
    return `${String(hour).padStart(2, '0')}:00`; // 13-23 = PM
  }
  
  // noon → 12:00
  if (input === 'noon') return '12:00';
  
  // midnight → 00:00
  if (input === 'midnight') return '00:00';
  
  return null;
};

module.exports = {
  isAdmin,
  parseDate,
  parseTime,
  formatDate
};
