import { pgTable, serial, integer, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  mrp: integer('mrp').notNull(),
  stock: integer('stock').notNull().default(25),
  emoji: text('emoji').notNull().default('💎'),
  hot: boolean('hot').notNull().default(false),
});

// Every user-owned row carries the Clerk user id; the server always filters on it.
export const cartItems = pgTable('cart_items', {
  userId: text('user_id').notNull(),
  productId: integer('product_id').notNull().references(() => products.id),
  qty: integer('qty').notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.productId] }) }));

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  subtotal: integer('subtotal').notNull(),
  shipping: integer('shipping').notNull(),
  total: integer('total').notNull(),
  status: text('status').notNull().default('placed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  qty: integer('qty').notNull(),
});
