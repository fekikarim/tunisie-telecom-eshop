import crypto from 'node:crypto';
import { HttpError } from '../utils/errors.js';

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
export const DELIVERY_FEE_MILLIMES = 8000; // 8 TND
export const FREE_DELIVERY_MILLIMES = 150000; // orders from 150 TND ship free

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let code = '';
  for (let i = 0; i < 6; i += 1) code += REF_CHARS[crypto.randomInt(REF_CHARS.length)];
  return `TT-${date}-${code}`;
}

/**
 * Creates an order atomically: validates stock, decrements it, stores a snapshot
 * of names and prices, and computes the total on the server.
 * Any failure throws inside the transaction, which rolls everything back.
 */
export function createOrder(db, { user, lines, customer, paymentMethod }) {
  const getProduct = db.prepare('SELECT id, name, price_millimes, stock FROM products WHERE id = ?');
  const decrementStock = db.prepare(
    "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ? AND stock >= ?"
  );
  const insertOrder = db.prepare(`
    INSERT INTO orders (reference, user_id, status, payment_method, payment_status,
      customer_name, customer_phone, customer_email, delivery_address, city, notes,
      subtotal_millimes, delivery_fee_millimes, total_millimes)
    VALUES (?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price_millimes, quantity, line_total_millimes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const place = db.transaction(() => {
    let subtotal = 0;
    const priced = [];
    for (const line of lines) {
      const product = getProduct.get(line.productId);
      if (!product) throw new HttpError(404, 'One of the products in your cart no longer exists');
      if (product.stock < line.quantity) {
        throw new HttpError(
          409,
          product.stock === 0
            ? `"${product.name}" is out of stock`
            : `Only ${product.stock} unit(s) of "${product.name}" are available`
        );
      }
      const result = decrementStock.run(line.quantity, product.id, line.quantity);
      if (result.changes !== 1) {
        throw new HttpError(409, `Stock for "${product.name}" changed, please review your cart`);
      }
      const lineTotal = product.price_millimes * line.quantity;
      subtotal += lineTotal;
      priced.push({ product, quantity: line.quantity, lineTotal });
    }

    const deliveryFee = subtotal >= FREE_DELIVERY_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
    const total = subtotal + deliveryFee;
    const paymentStatus = paymentMethod === 'card' ? 'paid' : 'unpaid'; // simulated card payment

    const info = insertOrder.run(
      generateReference(), user.id, paymentMethod, paymentStatus,
      customer.fullName, customer.phone, customer.email, customer.address, customer.city, customer.notes,
      subtotal, deliveryFee, total
    );
    for (const item of priced) {
      insertItem.run(
        info.lastInsertRowid, item.product.id, item.product.name,
        item.product.price_millimes, item.quantity, item.lineTotal
      );
    }
    return Number(info.lastInsertRowid);
  });

  return place();
}

/**
 * Changes an order status. Moving to Cancelled returns the reserved stock;
 * a cancelled order cannot be reopened, so stock is never double-counted.
 */
export function updateOrderStatus(db, orderId, newStatus) {
  const apply = db.transaction(() => {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status === newStatus) return;
    if (order.status === 'Cancelled') {
      throw new HttpError(409, 'Cancelled orders cannot be reopened');
    }
    if (newStatus === 'Cancelled') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);
      const restock = db.prepare('UPDATE products SET stock = stock + ?, updated_at = datetime(\'now\') WHERE id = ?');
      for (const item of items) {
        if (item.product_id !== null) restock.run(item.quantity, item.product_id);
      }
    }
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, orderId);
  });
  apply();
}

export const toTND = (millimes) => Number((millimes / 1000).toFixed(3));

function serializeItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    imageUrl: row.image_url ?? null,
    unitPrice: toTND(row.unit_price_millimes),
    quantity: row.quantity,
    lineTotal: toTND(row.line_total_millimes),
  };
}

function serializeOrder(row, items) {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    customer: {
      userId: row.user_id,
      fullName: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      address: row.delivery_address,
      city: row.city,
      notes: row.notes,
    },
    subtotal: toTND(row.subtotal_millimes),
    deliveryFee: toTND(row.delivery_fee_millimes),
    total: toTND(row.total_millimes),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ORDER_QUERY = `
  SELECT o.*, p.image_url, i.id AS item_id, i.product_id, i.product_name,
         i.unit_price_millimes, i.quantity, i.line_total_millimes
  FROM orders o
  LEFT JOIN order_items i ON i.order_id = o.id
  LEFT JOIN products p ON p.id = i.product_id
`;

/** Returns orders (with their items) matching the given filter, newest first. */
export function findOrders(db, { userId, status } = {}) {
  const where = [];
  const params = [];
  if (userId !== undefined) { where.push('o.user_id = ?'); params.push(userId); }
  if (status) { where.push('o.status = ?'); params.push(status); }
  const sql = `${ORDER_QUERY} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY o.created_at DESC, o.id DESC, i.id ASC`;

  const grouped = new Map();
  for (const row of db.prepare(sql).all(...params)) {
    if (!grouped.has(row.id)) grouped.set(row.id, { row, items: [] });
    if (row.item_id !== null) grouped.get(row.id).items.push(serializeItem({ ...row, id: row.item_id }));
  }
  return [...grouped.values()].map(({ row, items }) => serializeOrder(row, items));
}

export function findOrderById(db, id) {
  return findOrders(db).find((order) => order.id === id) ?? null;
}
