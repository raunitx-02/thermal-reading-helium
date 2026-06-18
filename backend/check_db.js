require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    const resUsers = await client.query('SELECT count(*) FROM users');
    const resTrains = await client.query('SELECT count(*) FROM trains');
    const resAssignments = await client.query('SELECT count(*) FROM assignments');
    
    console.log('--- DATABASE STATUS ---');
    console.log('Users count:', resUsers.rows[0].count);
    console.log('Trains count:', resTrains.rows[0].count);
    console.log('Assignments count:', resAssignments.rows[0].count);
    
    if (resAssignments.rows[0].count > 0) {
      const details = await client.query('SELECT * FROM assignments');
      console.log('Assignments:', details.rows);
    }
  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
