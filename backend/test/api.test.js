// End-to-end API acceptance tests.
// Starts the real server on a temporary database and walks through the admin,
// customer and order-management workflows, then restarts it to check persistence.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-test-'));
const PORT = 4100 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}/api`;
const env = {
  ...process.env,
  PORT: String(PORT),
  DB_PATH: path.join(tmp, 'test.db'),
  UPLOAD_DIR: path.join(tmp, 'uploads'),
  JWT_SECRET: 'test-secret-for-acceptance-tests',
};

let server;
function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn(process.execPath, ['src/server.js'], { cwd: backendRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    server.stdout.on('data', (d) => {
      output += d;
      if (output.includes('listening')) resolve();
    });
    server.stderr.on('data', (d) => { output += d; });
    server.on('exit', (code) => {
      if (!output.includes('listening')) reject(new Error(`server exited ${code}: ${output}`));
    });
  });
}
function stopServer() {
  return new Promise((resolve) => {
    if (!server || server.exitCode !== null) return resolve();
    server.once('exit', resolve);
    server.kill('SIGTERM');
  });
}

async function api(method, route, { token, body } = {}) {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

const login = async (email, password) => {
  const r = await api('POST', '/auth/login', { body: { email, password } });
  assert.equal(r.status, 200, `login failed for ${email}`);
  return r.data.token;
};

const checkout = (token, items, paymentMethod = 'cod', card) => api('POST', '/orders', {
  token,
  body: {
    items,
    customer: { fullName: 'Test Customer', phone: '+216 98 123 456', email: 'user@test.tn', address: '12 Rue de Marseille', city: 'Tunis', notes: '' },
    paymentMethod,
    ...(card ? { card } : {}),
  },
});

let adminToken;
let customerToken;
let productId;
let orderId;

before(async () => {
  await startServer();
  adminToken = await login('admin@telecom.tn', 'Admin123!');
  customerToken = await login('user@test.tn', 'User123!');
});
after(async () => {
  await stopServer();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('Test 1 - administrator creates, edits and deletes a product', async () => {
  const created = await api('POST', '/products', {
    token: adminToken,
    body: { name: 'Test Earbuds Pro', description: 'Created by acceptance test', price: 99.5, categoryId: 5, stock: 7, imageUrl: '' },
  });
  assert.equal(created.status, 201);
  productId = created.data.id;
  assert.equal(created.data.price, 99.5);

  const shop = await api('GET', '/products?search=Earbuds%20Pro');
  assert.ok(shop.data.some((p) => p.id === productId), 'new product visible in shop');

  const edited = await api('PUT', `/products/${productId}`, { token: adminToken, body: { price: 89.25, stock: 4 } });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.price, 89.25);
  assert.equal(edited.data.stock, 4);

  const deleted = await api('DELETE', `/products/${productId}`, { token: adminToken });
  assert.equal(deleted.status, 204);
  assert.equal((await api('GET', `/products/${productId}`)).status, 404);
});

test('Backend validation rejects bad product input', async () => {
  const r = await api('POST', '/products', { token: adminToken, body: { name: 'X', price: -5, categoryId: 999, stock: -1 } });
  assert.equal(r.status, 400);
  assert.ok(r.data.errors.price && r.data.errors.categoryId && r.data.errors.stock && r.data.errors.name);
});

test('Customers cannot reach admin routes', async () => {
  assert.equal((await api('POST', '/products', { token: customerToken, body: {} })).status, 403);
  assert.equal((await api('GET', '/admin/dashboard', { token: customerToken })).status, 403);
  assert.equal((await api('GET', '/orders', { token: customerToken })).status, 403);
  assert.equal((await api('GET', '/products')).status, 200);
});

test('Test 2 - customer buys a product; stock decreases; order appears in My Orders', async () => {
  const headphones = (await api('GET', '/products?category=audio')).data.find((p) => p.name.startsWith('Wireless Noise'));
  const stockBefore = headphones.stock;

  const order = await checkout(customerToken, [{ productId: headphones.id, quantity: 1 }]);
  assert.equal(order.status, 201, JSON.stringify(order.data));
  orderId = order.data.id;
  assert.match(order.data.reference, /^TT-\d{8}-[A-Z0-9]{6}$/);
  assert.equal(order.data.status, 'Pending');
  assert.equal(order.data.total, Number((order.data.subtotal + order.data.deliveryFee).toFixed(3)));

  assert.equal((await api('GET', `/products/${headphones.id}`)).data.stock, stockBefore - 1, 'stock decreased');
  const mine = await api('GET', '/orders/my-orders', { token: customerToken });
  assert.ok(mine.data.some((o) => o.id === orderId), 'order listed in My Orders');
});

test('Quantities are enforced: no purchase beyond stock, invalid quantities rejected', async () => {
  const power = (await api('GET', '/products?search=Power%20Bank')).data[0];
  assert.equal(power.stock, 0);
  assert.equal((await checkout(customerToken, [{ productId: power.id, quantity: 1 }])).status, 409);
  const bad = await api('POST', '/orders', { token: customerToken, body: { items: [{ productId: 1, quantity: 0 }], customer: {}, paymentMethod: 'cod' } });
  assert.equal(bad.status, 400);
});

test('Customers cannot view other customers orders', async () => {
  const sarra = await login('sarra@test.tn', 'User123!');
  assert.equal((await api('GET', `/orders/${orderId}`, { token: sarra })).status, 404);
});

test('Test 3 - admin finds, inspects and updates the order; customer sees the change', async () => {
  const list = await api('GET', '/orders?status=Pending', { token: adminToken });
  assert.ok(list.data.some((o) => o.id === orderId));

  const detail = await api('GET', `/orders/${orderId}`, { token: adminToken });
  assert.equal(detail.data.items.length, 1);

  const updated = await api('PUT', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'Shipped' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.status, 'Shipped');

  const mine = await api('GET', '/orders/my-orders', { token: customerToken });
  assert.equal(mine.data.find((o) => o.id === orderId).status, 'Shipped');

  assert.equal((await api('PUT', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'Lost' } })).status, 400);
});

test('Cancelling an order restores stock; cancelled orders cannot be reopened', async () => {
  const headphones = (await api('GET', '/products?search=Wireless%20Noise')).data[0];
  const stockBefore = headphones.stock;
  assert.equal((await api('PUT', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'Cancelled' } })).status, 200);
  assert.equal((await api('GET', `/products/${headphones.id}`)).data.stock, stockBefore + 1);
  assert.equal((await api('PUT', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'Pending' } })).status, 409);
});

test('Dashboard returns statistics for the admin', async () => {
  const r = await api('GET', '/admin/dashboard', { token: adminToken });
  assert.equal(r.status, 200);
  assert.ok(r.data.totals.products >= 15);
  assert.equal(r.data.totals.customers, 3);
  assert.equal(r.data.revenueTrend.length, 7);
  assert.ok(r.data.recentOrders.length > 0);
});

test('Card payments are simulated: invalid card rejected, valid card marked paid', async () => {
  const earbuds = (await api('GET', '/products?search=Earbuds')).data.find((p) => p.name.startsWith('True'));
  const badCard = { name: 'Test Customer', number: '4111111111111112', expiry: '12/30', cvc: '123' };
  assert.equal((await checkout(customerToken, [{ productId: earbuds.id, quantity: 1 }], 'card', badCard)).status, 400);
  const goodCard = { name: 'Test Customer', number: '4111 1111 1111 1111', expiry: '12/30', cvc: '123' };
  const paid = await checkout(customerToken, [{ productId: earbuds.id, quantity: 1 }], 'card', goodCard);
  assert.equal(paid.status, 201);
  assert.equal(paid.data.paymentStatus, 'paid');
});

test('Test 4 - data persists after restarting the backend, no duplicate seeding', async () => {
  const productsBefore = (await api('GET', '/products')).data.length;
  const ordersBefore = (await api('GET', '/orders', { token: adminToken })).data.length;
  await stopServer();
  await startServer();
  const adminAgain = await login('admin@telecom.tn', 'Admin123!');
  assert.equal((await api('GET', '/products')).data.length, productsBefore, 'products not duplicated or lost');
  assert.equal((await api('GET', '/orders', { token: adminAgain })).data.length, ordersBefore, 'orders persisted');
  assert.ok(await login('user@test.tn', 'User123!'));
});
