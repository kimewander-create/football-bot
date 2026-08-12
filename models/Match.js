const { query, run, get } = require('../config/database');

class Match {
  static async create(data) {
    const { matchDate, matchTime, venue, fee, createdBy } = data;
    return run(`
      INSERT INTO matches (matchDate, matchTime, venue, fee, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `, [matchDate, matchTime, venue, fee, createdBy]);
  }

  static async findById(id) {
    return get('SELECT * FROM matches WHERE id = ?', [id]);
  }

  static async findUpcoming() {
    return query(`
      SELECT * FROM matches 
      WHERE status = 'scheduled' 
      ORDER BY matchDate ASC, matchTime ASC
    `);
  }

  static async findAll() {
    return query('SELECT * FROM matches ORDER BY matchDate DESC');
  }
}

module.exports = Match;
