const { query, run, get } = require('../config/database');

class Payment {
  static async create(data) {
    const { userId, matchId, amount, paymentType, method, screenshotPath, screenshotFileId, scrapedData } = data;

    run(`
      INSERT INTO payments 
      (userId, matchId, amount, paymentType, method, screenshotPath, screenshotFileId, scrapedData, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [userId, matchId || null, amount, paymentType || 'single', method || 'telebirr', screenshotPath || '', screenshotFileId || '', scrapedData || '']);

    // ✅ Get the ID directly from the database
    const result = get('SELECT MAX(id) as id FROM payments WHERE userId = ?', [userId]);
    const paymentId = result?.id || 0;

    console.log('✅ Payment created with ID:', paymentId);

    return { id: paymentId };
  }

  static async findById(id) {
    return get('SELECT * FROM payments WHERE id = ?', [id]);
  }

  static async findByUser(userId) {
    return query(`
      SELECT * FROM payments 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `, [userId]);
  }

  static async findPending() {
    return query(`
      SELECT p.*, u.firstName, u.lastName, u.telegramId
      FROM payments p
      JOIN users u ON p.userId = u.telegramId
      WHERE p.status = 'pending'
      ORDER BY p.createdAt ASC
    `);
  }

  static async verify(id, verifiedBy) {
    return run(`
      UPDATE payments 
      SET status = 'verified', verifiedBy = ?, verifiedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [verifiedBy, id]);
  }

  static async reject(id, reason) {
    return run(`
      UPDATE payments 
      SET status = 'rejected', rejectionReason = ?
      WHERE id = ?
    `, [reason || 'Payment rejected', id]);
  }

  static async getTotalByUser(userId) {
    const result = get(`
      SELECT SUM(amount) as total 
      FROM payments 
      WHERE userId = ? AND status = 'verified'
    `, [userId]);
    return result?.total || 0;
  }
}

module.exports = Payment;
