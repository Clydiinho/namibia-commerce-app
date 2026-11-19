import { Pool } from 'pg';

// Initialize the PostgreSQL connection pool.
// In a production environment, this will use environment variables (e.g., process.env.DATABASE_URL).
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/namibia_commerce',
});

// Helper to test the connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
