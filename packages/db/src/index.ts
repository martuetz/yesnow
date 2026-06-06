import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export * from "./schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/yesnow",
});

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;
export type DbSchema = typeof schema;
