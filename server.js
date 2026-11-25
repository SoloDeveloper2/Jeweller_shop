import express from 'express';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { db } from './db/index.js';
import { products, cartItems, orders, orderItems } from './db/schema.js';
import './db/seed.js';

const ADMINS = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/api', clerkMiddleware());

const fail = (status, message) => Object.assign(new Error(message), { status });
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(e.status || 500).json({ error: e.message }));
// The user id always comes from the verified Clerk session, never from the request body or URL.
const uid = (req) => { const { userId } = getAuth(req); if (!userId) throw fail(401, 'Please sign in'); return userId; };
const isAdmin = async (req) => (await clerkClient.users.getUser(uid(req))).emailAddresses.some((e) => ADMINS.includes(e.emailAddress.toLowerCase()));
const needAdmin = async (req) => { if (!(await isAdmin(req))) throw fail(403, 'Admin access only'); };

app.get('/api/products', wrap(async (_q, res) => res.json(await db.select().from(products).orderBy(products.id))));
app.get('/api/products/:id', wrap(async (q, res) => {
  const [p] = await db.select().from(products).where(eq(products.id, +q.params.id) );
  if (!p) throw fail(404, 'Product not found');
  res.json(p);
}));
app.get('/api/me', wrap(async (q, res) => res.json({ admin: await isAdmin(q) })));

const cartOf = (userId) => db.select({ productId: cartItems.productId, qty: cartItems.qty, name: products.name, price: products.price, emoji: products.emoji, stock: products.stock })
  .from(cartItems).innerJoin(products, eq(products.id, cartItems.productId)).where(eq(cartItems.userId, userId)).orderBy(cartItems.productId);

app.get('/api/cart', wrap(async (q, res) => res.json(await cartOf(uid(q)))));
app.put('/api/cart/:pid', wrap(async (q, res) => {
  const userId = uid(q), productId = +q.params.pid, qty = Math.min(10, Math.floor(+q.body?.qty) || 0);
  if (qty < 1) await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  else {
    const [p] = await db.select().from(products).where(eq(products.id, productId));
    if (!p) throw fail(404, 'Product not found');
    await db.insert(cartItems).values({ userId, productId, qty }).onConflictDoUpdate({ target: [cartItems.userId, cartItems.productId], set: { qty } });
  }
  res.json(await cartOf(userId));
}));

// The order is built from the signed-in user's own cart on the server; prices and stock come from the database.
app.post('/api/orders', wrap(async (q, res) => {
  const userId = uid(q), { name, phone, address } = q.body || {};
  if (!name?.trim() || !/^\d{10}$/.test(phone || '') || !address?.trim()) throw fail(400, 'Enter your name, a 10-digit phone number and a full address.');
  const order = await db.transaction(async (tx) => {
    const lines = await tx.select({ productId: cartItems.productId, qty: cartItems.qty, name: products.name, price: products.price })
      .from(cartItems).innerJoin(products, eq(products.id, cartItems.productId)).where(eq(cartItems.userId, userId));
    if (!lines.length) throw fail(400, 'Your cart is empty.');
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0), shipping = subtotal >= 599 ? 0 : 60;
    const [o] = await tx.insert(orders).values({ userId, name: name.trim(), phone, address: address.trim(), subtotal, shipping, total: subtotal + shipping }).returning();
    for (const l of lines) {
      const ok = await tx.update(products).set({ stock: sql`${products.stock} - ${l.qty}` }).where(and(eq(products.id, l.productId), gte(products.stock, l.qty))).returning({ id: products.id });
      if (!ok.length) throw fail(400, `${l.name} is out of stock.`);
      await tx.insert(orderItems).values({ orderId: o.id, productId: l.productId, name: l.name, price: l.price, qty: l.qty });
    }
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    return o;
  });
  res.json({ ok: true, order });
}));

const withItems = async (list) => {
  const items = list.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, list.map((o) => o.id))) : [];
  return list.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
};
app.get('/api/orders', wrap(async (q, res) => res.json(await withItems(await db.select().from(orders).where(eq(orders.userId, uid(q))).orderBy(desc(orders.id))))));
app.get('/api/admin/orders', wrap(async (q, res) => { await needAdmin(q); res.json(await withItems(await db.select().from(orders).orderBy(desc(orders.id)))); }));
app.patch('/api/admin/orders/:id', wrap(async (q, res) => {
  await needAdmin(q);
  if (!['placed', 'shipped', 'delivered', 'cancelled'].includes(q.body?.status)) throw fail(400, 'Unknown status');
  await db.update(orders).set({ status: q.body.status }).where(eq(orders.id, +q.params.id));
  res.json({ ok: true });
}));

app.listen(process.env.PORT || 3000, () => console.log('Rayzex.Zone running at http://localhost:3000'));
if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => console.log('Running'));
}
module.exports = app;