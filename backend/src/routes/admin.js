import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { findOrders, toTND, ORDER_STATUSES } from '../services/orders.js';

export function adminRoutes(db) {
  const router = Router();
  router.use(authenticate(db), requireRole('admin'));

  router.get('/dashboard', (req, res) => {
    const count = (sql) => db.prepare(sql).get().n;
    const revenue = db.prepare("SELECT COALESCE(SUM(total_millimes), 0) AS n FROM orders WHERE status != 'Cancelled'").get().n;

    const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
    for (const row of db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all()) {
      byStatus[row.status] = row.n;
    }

    const lowStock = db.prepare(`
      SELECT id, name, stock, image_url FROM products WHERE stock <= 5 ORDER BY stock ASC, name ASC LIMIT 6
    `).all().map((p) => ({ id: p.id, name: p.name, stock: p.stock, imageUrl: p.image_url }));

    const recentOrders = findOrders(db).slice(0, 6).map((o) => ({
      id: o.id, reference: o.reference, status: o.status, total: o.total,
      customerName: o.customer.fullName, itemCount: o.itemCount, createdAt: o.createdAt,
    }));

    // Revenue for the last 7 days (for the trend chart), oldest first.
    const trend = db.prepare(`
      SELECT date(created_at) AS day, COALESCE(SUM(total_millimes), 0) AS total, COUNT(*) AS orders
      FROM orders WHERE status != 'Cancelled' AND created_at >= date('now', '-6 days')
      GROUP BY date(created_at)`).all();
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const hit = trend.find((t) => t.day === day);
      days.push({ day, revenue: toTND(hit?.total ?? 0), orders: hit?.orders ?? 0 });
    }

    res.json({
      totals: {
        products: count('SELECT COUNT(*) AS n FROM products'),
        orders: count('SELECT COUNT(*) AS n FROM orders'),
        customers: count("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
        revenue: toTND(revenue),
        lowStock: lowStock.length,
      },
      ordersByStatus: byStatus,
      recentOrders,
      lowStockProducts: lowStock,
      revenueTrend: days,
    });
  });

  return router;
}
