import { db } from './index.js';
import { products } from './schema.js';

if ((await db.select().from(products)).length) {
  console.log('Already seeded');
} else {
  // Placeholder catalogue: replace with your own products before going live.
  await db.insert(products).values([
    { name: 'Light Wala Jhumka (LED earrings)', category: 'Earrings', price: 698, mrp: 1599, emoji: '✨', hot: true },
    { name: 'Emilia Dreamy Butterfly Earrings', category: 'Earrings', price: 699, mrp: 1200, emoji: '🦋' },
    { name: 'Rose Romance Chandelier Drop Earrings', category: 'Earrings', price: 499, mrp: 999, emoji: '🌹', hot: true },
    { name: 'Aurora Emerald Cascade Earrings', category: 'Earrings', price: 349, mrp: 699, emoji: '💚', hot: true },
    { name: 'Elsa Minimal Promise Ring', category: 'Rings', price: 249, mrp: 450, emoji: '💍' },
    { name: 'Quirky Cottagecore Toad Ring', category: 'Rings', price: 299, mrp: 699, emoji: '🐸', hot: true },
    { name: 'Cosmic Dreamer Ring', category: 'Rings', price: 199, mrp: 399, emoji: '🌌', hot: true },
    { name: 'Iced-out Initial Necklace', category: 'Necklaces', price: 499, mrp: 999, emoji: '🔠', hot: true },
    { name: 'Soft Blushing Swan Necklace', category: 'Necklaces', price: 349, mrp: 599, emoji: '🦢' },
    { name: 'Sonic Plug Lariat Necklace', category: 'Necklaces', price: 299, mrp: 999, emoji: '🎧', hot: true },
    { name: 'Coffee Date Claw Clip', category: 'Hair', price: 229, mrp: 399, emoji: '☕', hot: true },
    { name: 'Candy-Coded Heart Hair Clip', category: 'Hair', price: 79, mrp: 159, emoji: '💗', hot: true },
    { name: 'Hot Girl Double Layered Waist Chain', category: 'Waist chains', price: 499, mrp: 999, emoji: '⛓️', hot: true },
    { name: 'Diet Coke Paglu Bag Charm', category: 'Bag charms', price: 249, mrp: 399, emoji: '🥤', hot: true },
    { name: 'Classic Onyx Watch', category: 'Watches', price: 999, mrp: 1999, emoji: '⌚', hot: true },
  ]);
  console.log('Seeded 15 products');
}
