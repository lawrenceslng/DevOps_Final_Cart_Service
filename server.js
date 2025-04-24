// server.js
const express = require('express');
const redis = require('redis');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch(console.error);

// 🛒 Get cart
app.get('/cart', async (req, res) => {
  const { user_email } = req.query;
  if (!user_email) return res.status(400).json({ error: 'Missing user_email' });
    const prefix = process.env.ENV_PREFIX || 'default';
  const key = `${prefix}:cart:user:${user_email}`;
  const cart = await redisClient.hGetAll(key);
  res.json(cart);
});

// ➕ Add to cart
app.post('/cart', async (req, res) => {
  const { user_email, product_id, quantity } = req.body;
  if (!user_email || !product_id || quantity == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const prefix = process.env.ENV_PREFIX || 'default';
  const key = `${prefix}:cart:user:${user_email}`;
  await redisClient.hSet(key, product_id, quantity);
  res.json({ message: 'Product added to cart' });
});

// ➖ Remove from cart
app.delete('/cart', async (req, res) => {
  const { user_email, product_id } = req.body;
  if (!user_email || !product_id) {
    return res.status(400).json({ error: 'Missing user_email or product_id' });
  }
  const prefix = process.env.ENV_PREFIX || 'default';
  const key = `${prefix}:cart:user:${user_email}`;
  await redisClient.hDel(key, product_id);
  res.json({ message: 'Product removed from cart' });
});

// 🧹 Clear cart
app.post('/cart/clear', async (req, res) => {
  const { user_email } = req.body;
  if (!user_email) return res.status(400).json({ error: 'Missing user_email' });
  const prefix = process.env.ENV_PREFIX || 'default';
  const key = `${prefix}:cart:user:${user_email}`;
  await redisClient.del(key);
  res.json({ message: 'Cart cleared' });
});

// ✅ GET /cart/health – Health Check
app.get('/cart/health', async (req, res) => {
    res.status(200).json({ message: 'Cart Service is healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});
