# ⚽ Football Attendance Bot

## Features
- ✅ User registration (Telegram ID + Phone)
- ✅ Match creation with date/time pickers
- ✅ Screenshot payment verification
- ✅ Auto-scrape amount/date/sender from screenshots
- ✅ Admin approve/reject with one click
- ✅ Auto-add balance to wallet
- ✅ Confirm matches with auto-deduct
- ✅ Complete history & reports
- ✅ Menu buttons (stays on screen)

## Setup
1. Copy `.env.example` to `.env`
2. Add your `BOT_TOKEN` and `ADMIN_IDS`
3. Run `npm install`
4. Run `node app.js`

## Commands
- `/start` - Register
- `/menu` - Main menu

## Admin Commands
- `addbalance TELEGRAM_ID AMOUNT` - Manual balance add
- Match creation via menu buttons

## Tech Stack
- Node.js
- Telegraf (Telegram Bot API)
- SQL.js (SQLite)
- Tesseract.js (OCR)

## Author
Built with ❤️ for Ethiopian football ⚽
