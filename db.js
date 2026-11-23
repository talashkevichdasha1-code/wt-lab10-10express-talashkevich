
require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,

    host: process.env.DATABASE_URL
        ? undefined
        : process.env.DB_HOST,

    port: process.env.DATABASE_URL
        ? undefined
        : Number(process.env.DB_PORT),

    database: process.env.DATABASE_URL
        ? undefined
        : process.env.DB_NAME,

    user: process.env.DATABASE_URL
        ? undefined
        : process.env.DB_USER,

    password: process.env.DATABASE_URL
        ? undefined
        : process.env.DB_PASSWORD,

    options: process.env.DATABASE_URL
        ? "-c search_path=wt_lab10"
        : undefined,

    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false
});

module.exports = pool;
