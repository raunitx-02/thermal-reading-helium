const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2, // Keep connection pool small to prevent connection exhaustion on serverless containers
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
});

const queryCache = new Map();

function translateQuery(sql) {
  if (queryCache.has(sql)) {
    return queryCache.get(sql);
  }
  let index = 1;
  let translatedSql = sql.replace(/\?/g, () => `$${index++}`);
  // Replace LIKE with ILIKE for case-insensitive matching in Postgres
  translatedSql = translatedSql.replace(/\s+LIKE\s+/gi, ' ILIKE ');
  queryCache.set(sql, translatedSql);
  return translatedSql;
}

const dbMock = {
  prepare: (sql) => {
    const pgSql = translateQuery(sql);
    return {
      all: async (...params) => {
        const res = await pool.query(pgSql, params);
        return res.rows;
      },
      get: async (...params) => {
        const res = await pool.query(pgSql, params);
        return res.rows[0];
      },
      run: async (...params) => {
        const res = await pool.query(pgSql, params);
        return { changes: res.rowCount };
      }
    };
  },
  exec: async (sql) => {
    await pool.query(sql);
  }
};

function getDb() {
  return dbMock;
}

async function initDb() {
  return dbMock;
}

module.exports = { getDb, initDb, pool };
