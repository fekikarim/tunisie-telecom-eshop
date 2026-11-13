import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/errors.js';

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price_millimes ASC, p.id ASC',
  price_desc: 'p.price_millimes DESC, p.id ASC',
  name: 'p.name COLLATE NOCASE ASC',
  popular: '(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.product_id = p.id) DESC, p.id ASC',
};
const IMAGE_RE = /^(https?:\/\/\S+|\/(uploads|products)\/[\w\-./]+)$/;

const SELECT_PRODUCT = `
  SELECT p.id, p.name, p.description, p.price_millimes, p.stock, p.image_url,
         p.category_id, c.name AS category_name, c.slug AS category_slug,
         p.created_at, p.updated_at
  FROM products p JOIN categories c ON c.id = p.category_id`;

export const serializeProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number((row.price_millimes / 1000).toFixed(3)),
  stock: row.stock,
  imageUrl: row.image_url,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categorySlug: row.category_slug,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Validates product input. Missing fields fall back to `base`
 * (existing values on update, defaults on create).
 */
function parseProduct(db, body, base) {
  const errors = {};
  const pick = (key) => (body[key] !== undefined ? body[key] : base[key]);

  const name = String(pick('name') ?? '').trim();
  if (name.length < 2 || name.length > 120) errors.name = 'Name must be between 2 and 120 characters';

  const description = String(pick('description') ?? '').trim();
  if (description.length > 2000) errors.description = 'Description must be 2000 characters or fewer';

  const rawPrice = pick('price');
  const price = typeof rawPrice === 'string' && rawPrice.trim() !== '' ? Number(rawPrice) : rawPrice;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 1_000_000) {
    errors.price = 'Price must be a positive amount in TND (max 1,000,000)';
  } else if (Math.abs(Math.round(price * 1000) - price * 1000) > 1e-6) {
    errors.price = 'Price can have at most 3 decimal places';
  }

  const categoryId = Number(pick('categoryId'));
  if (!Number.isInteger(categoryId) || !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId)) {
    errors.categoryId = 'Select a valid category';
  }

  const rawStock = pick('stock');
  const stock = typeof rawStock === 'string' && rawStock.trim() !== '' ? Number(rawStock) : rawStock;
  if (!Number.isInteger(stock) || stock < 0 || stock > 100_000) {
    errors.stock = 'Stock must be a whole number between 0 and 100,000';
  }

  const imageUrl = String(pick('imageUrl') ?? '').trim();
  if (imageUrl && (imageUrl.length > 500 || !IMAGE_RE.test(imageUrl))) {
    errors.imageUrl = 'Use a full http(s) image URL or an uploaded image';
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields', errors);
  return {
    name,
    description,
    priceMillimes: Math.round(price * 1000),
    categoryId,
    stock,
    imageUrl: imageUrl || null,
  };
}

const toInput = (row) => ({
  name: row.name,
  description: row.description,
  price: row.price_millimes / 1000,
  categoryId: row.category_id,
  stock: row.stock,
  imageUrl: row.image_url ?? '',
});

export function productRoutes(db) {
  const router = Router();
  const requireUser = authenticate(db);
  const admin = [requireUser, requireRole('admin')];

  const getRow = (id) => db.prepare(`${SELECT_PRODUCT} WHERE p.id = ?`).get(id);

  router.get('/', (req, res) => {
    const where = [];
    const params = [];
    const category = String(req.query.category ?? '').trim();
    const search = String(req.query.search ?? '').trim().slice(0, 100);
    const sort = Object.hasOwn(SORTS, req.query.sort) ? req.query.sort : 'newest';

    if (category && category !== 'all') { where.push('c.slug = ?'); params.push(category); }
    if (search) {
      const escaped = search.replace(/[\\%_]/g, (ch) => `\\${ch}`);
      where.push("(p.name LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')");
      params.push(`%${escaped}%`, `%${escaped}%`);
    }
    const limit = Number.parseInt(req.query.limit, 10);
    const limitSql = Number.isInteger(limit) && limit > 0 ? ` LIMIT ${Math.min(limit, 50)}` : '';
    const sql = `${SELECT_PRODUCT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${SORTS[sort]}${limitSql}`;
    res.json(db.prepare(sql).all(...params).map(serializeProduct));
  });

  router.get('/:id', (req, res) => {
    const row = getRow(Number(req.params.id));
    if (!row) throw new HttpError(404, 'Product not found');
    res.json(serializeProduct(row));
  });

  router.post('/', ...admin, (req, res) => {
    const input = parseProduct(db, req.body ?? {}, {
      name: '', description: '', price: undefined, categoryId: undefined, stock: 0, imageUrl: '',
    });
    const info = db.prepare(`
      INSERT INTO products (name, description, price_millimes, stock, image_url, category_id)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      input.name, input.description, input.priceMillimes, input.stock, input.imageUrl, input.categoryId
    );
    res.status(201).json(serializeProduct(getRow(info.lastInsertRowid)));
  });

  router.put('/:id', ...admin, (req, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) throw new HttpError(404, 'Product not found');
    const input = parseProduct(db, req.body ?? {}, toInput(existing));
    db.prepare(`
      UPDATE products SET name = ?, description = ?, price_millimes = ?, stock = ?,
        image_url = ?, category_id = ?, updated_at = datetime('now')
      WHERE id = ?`).run(
      input.name, input.description, input.priceMillimes, input.stock, input.imageUrl, input.categoryId, id
    );
    res.json(serializeProduct(getRow(id)));
  });

  router.delete('/:id', ...admin, (req, res) => {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id));
    if (info.changes === 0) throw new HttpError(404, 'Product not found');
    res.status(204).end();
  });

  return router;
}
