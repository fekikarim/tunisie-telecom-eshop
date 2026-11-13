import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { productRoutes } from './routes/products.js';
import { categoryRoutes } from './routes/categories.js';
import { orderRoutes } from './routes/orders.js';
import { adminRoutes } from './routes/admin.js';
import { uploadRoutes } from './routes/uploads.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp(db) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/uploads', express.static(config.uploadDir));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/products', productRoutes(db));
  app.use('/api/categories', categoryRoutes(db));
  app.use('/api/orders', orderRoutes(db));
  app.use('/api/admin', adminRoutes(db));
  app.use('/api/uploads', uploadRoutes(db));

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
