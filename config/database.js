const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db = null;

const initDB = async () => {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '..', 'data', 'football.db');
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegramId TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      username TEXT,
      phoneNumber TEXT,
      balance INTEGER DEFAULT 0,
      totalDeposited INTEGER DEFAULT 0,
      totalSpent INTEGER DEFAULT 0,
      matchesPlayed INTEGER DEFAULT 0,
      isAdmin INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchDate TEXT,
      matchTime TEXT,
      venue TEXT,
      fee INTEGER,
      status TEXT DEFAULT 'scheduled',
      createdBy TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      matchId INTEGER,
      amount INTEGER,
      paymentType TEXT DEFAULT 'single',
      method TEXT DEFAULT 'telebirr',
      screenshotPath TEXT,
      screenshotFileId TEXT,
      scrapedData TEXT,
      status TEXT DEFAULT 'pending',
      verifiedBy TEXT,
      verifiedAt DATETIME,
      rejectionReason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      matchId INTEGER,
      status TEXT DEFAULT 'present',
      paymentId INTEGER,
      markedBy TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized');
  return db;
};

const query = (sql, params = []) => {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  const result = [];
  stmt.bind(params);
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
};

const run = (sql, params = []) => {
  if (!db) throw new Error('Database not initialized');
  
  // ✅ Build the SQL with escaped values (safe since params are trusted)
  let sqlWithValues = sql;
  params.forEach((param, index) => {
    const placeholder = new RegExp(`\\?`, '');
    if (typeof param === 'string') {
      sqlWithValues = sqlWithValues.replace(placeholder, `'${param.replace(/'/g, "''")}'`);
    } else if (param === null) {
      sqlWithValues = sqlWithValues.replace(placeholder, 'NULL');
    } else {
      sqlWithValues = sqlWithValues.replace(placeholder, param);
    }
  });

  // ✅ Use db.exec() which returns results
  const result = db.exec(sqlWithValues);
  saveDB();
  
  // ✅ Get the last inserted ID
  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = idResult?.[0]?.values?.[0]?.[0] || 0;
  
  return { changes: 1, lastInsertRowid };
};

const saveDB = () => {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.join(__dirname, '..', 'data', 'football.db');
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  fs.writeFileSync(dbPath, buffer);
};

const get = (sql, params = []) => {
  const rows = query(sql, params);
  return rows[0] || null;
};

module.exports = { initDB, query, run, get, saveDB };
