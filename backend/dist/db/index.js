"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
// Initialize the PostgreSQL connection pool.
// In a production environment, this will use environment variables (e.g., process.env.DATABASE_URL).
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/namibia_commerce',
});
// Helper to test the connection
exports.pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
