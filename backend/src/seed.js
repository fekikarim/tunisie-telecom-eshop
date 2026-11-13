import bcrypt from 'bcryptjs';
import { CATEGORIES, PRODUCTS, DEMO_USERS, DEMO_ORDERS } from './data/catalog.js';
import { createOrder, updateOrderStatus } from './services/orders.js';

/**
 * Inserts demo data only when the database has no users yet (i.e. it is fresh).
 * Restarting the server on an existing database never duplicates or overwrites data.
 */
export function seedIfEmpty(db) {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count > 0) return false;

  const seed = db.transaction(() => {
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const user of DEMO_USERS) {
      insertUser.run(user.name, user.email, bcrypt.hashSync(user.password, 10), user.phone, user.address, user.role);
    }

    const insertCategory = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
    for (const category of CATEGORIES) insertCategory.run(category.name, category.slug);

    const categoryId = db.prepare('SELECT id FROM categories WHERE slug = ?');
    const insertProduct = db.prepare(
      'INSERT INTO products (name, description, price_millimes, stock, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const product of PRODUCTS) {
      insertProduct.run(
        product.name,
        product.description,
        Math.round(product.price * 1000),
        product.stock,
        `/products/${product.image}`,
        categoryId.get(product.category).id
      );
    }

    // Demo orders go through the same service used by real checkouts.
    const userByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
    const productByName = db.prepare('SELECT id FROM products WHERE name = ?');
    for (const order of DEMO_ORDERS) {
      const user = userByEmail.get(order.email);
      const orderId = createOrder(db, {
        user,
        lines: order.items.map(([name, quantity]) => ({
          productId: productByName.get(name).id,
          quantity,
        })),
        customer: {
          fullName: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          city: 'Tunis',
          notes: '',
        },
        paymentMethod: order.paymentMethod,
      });
      if (order.status !== 'Pending') updateOrderStatus(db, orderId, order.status);
    }
  });

  seed();
  return true;
}
