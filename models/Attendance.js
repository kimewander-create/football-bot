const { query, run, get } = require('../config/database');

class Attendance {
  static async create(data) {
    const { userId, matchId, status, paymentId, markedBy } = data;
    return run(`
      INSERT INTO attendance (userId, matchId, status, paymentId, markedBy)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, matchId, status, paymentId, markedBy]);
  }

  static async findByMatch(matchId) {
    return query(`
      SELECT a.*, u.firstName, u.lastName, u.balance
      FROM attendance a
      JOIN users u ON a.userId = u.telegramId
      WHERE a.matchId = ?
    `, [matchId]);
  }

  static async findByUser(userId) {
    return query(`
      SELECT a.*, m.matchDate, m.matchTime, m.venue
      FROM attendance a
      JOIN matches m ON a.matchId = m.id
      WHERE a.userId = ?
      ORDER BY m.matchDate DESC
    `, [userId]);
  }
}

module.exports = Attendance;
