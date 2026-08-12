const { query, run, get } = require('../config/database');

class User {
  static async create(data) {
    const { telegramId, firstName, lastName, username, phoneNumber } = data;
    return run(`
      INSERT OR REPLACE INTO users 
      (telegramId, firstName, lastName, username, phoneNumber)
      VALUES (?, ?, ?, ?, ?)
    `, [telegramId, firstName, lastName, username, phoneNumber]);
  }

  static async findByTelegramId(telegramId) {
    return get('SELECT * FROM users WHERE telegramId = ?', [telegramId]);
  }

  static async getAll() {
    return query('SELECT * FROM users ORDER BY firstName');
  }

  static async updateBalance(telegramId, amount) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new Error('User not found');
    return run(`
      UPDATE users 
      SET balance = balance + ?, 
          totalDeposited = totalDeposited + ?
      WHERE telegramId = ?
    `, [amount, amount > 0 ? amount : 0, telegramId]);
  }

  static async deductBalance(telegramId, amount) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new Error('User not found');
    if (user.balance < amount) throw new Error('Insufficient balance');
    return run(`
      UPDATE users 
      SET balance = balance - ?,
          totalSpent = totalSpent + ?,
          matchesPlayed = matchesPlayed + 1
      WHERE telegramId = ?
    `, [amount, amount, telegramId]);
  }

  static async update(telegramId, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    values.push(telegramId);
    return run(`UPDATE users SET ${setClause} WHERE telegramId = ?`, values);
  }

  static async isAdmin(telegramId) {
    const user = await this.findByTelegramId(telegramId);
    return user ? user.isAdmin === 1 : false;
  }
}

module.exports = User;
