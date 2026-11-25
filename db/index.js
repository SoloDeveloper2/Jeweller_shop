import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Add it to .env');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Creates the tables on first run, so no separate migration step is needed.
for (const q of [
  `CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL,mrp INTEGER NOT NULL,stock INTEGER NOT NULL DEFAULT 25,emoji TEXT NOT NULL DEFAULT '💎',hot BOOLEAN NOT NULL DEFAULT false)`,
  `CREATE TABLE IF NOT EXISTS cart_items(user_id TEXT NOT NULL,product_id INTEGER NOT NULL REFERENCES products(id),qty INTEGER NOT NULL,PRIMARY KEY(user_id,product_id))`,
  `CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,subtotal INTEGER NOT NULL,shipping INTEGER NOT NULL,total INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'placed',created_at TIMESTAMP NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS order_items(id SERIAL PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(id),product_id INTEGER NOT NULL,name TEXT NOT NULL,price INTEGER NOT NULL,qty INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id)`,
]) await pool.query(q);

export const db = drizzle(pool, { schema });
