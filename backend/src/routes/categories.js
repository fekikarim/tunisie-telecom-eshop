import { Router } from 'express';

export function categoryRoutes(db) {
  const router = Router();
  router.get('/', (req, res) => {
    res.json(db.prepare(`
      SELECT c.id, c.name, c.slug, COUNT(p.id) AS productCount
      FROM categories c LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id ORDER BY c.id`).all());
  });
  return router;
}
