import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
});

export default pool;
