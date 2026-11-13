import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/errors.js';
import { createOrder, findOrderById, findOrders, updateOrderStatus, ORDER_STATUSES } from '../services/orders.js';

const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Luhn checksum, used to validate the simulated card number format. */
function luhnValid(number) {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);
    if (double) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function validateCard(card, errors) {
  const number = String(card?.number ?? '').replace(/\s/g, '');
  if (!/^\d{12,19}$/.test(number) || !luhnValid(number)) errors['card.number'] = 'Enter a valid card number';
  if (String(card?.name ?? '').trim().length < 2) errors['card.name'] = 'Enter the name printed on the card';
  const match = /^(\d{2})\/(\d{2})$/.exec(String(card?.expiry ?? '').trim());
  const now = new Date();
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12
    || 2000 + Number(match[2]) < now.getFullYear()
    || (2000 + Number(match[2]) === now.getFullYear() && Number(match[1]) < now.getMonth() + 1)) {
    errors['card.expiry'] = 'Enter a valid, unexpired expiry date (MM/YY)';
  }
  if (!/^\d{3,4}$/.test(String(card?.cvc ?? ''))) errors['card.cvc'] = 'CVC must be 3 or 4 digits';
}

/** Validates the checkout payload and returns normalised values. */
function parseCheckout(body) {
  const errors = {};
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) errors.items = 'Your cart is empty';
  if (items.length > 50) errors.items = 'Too many distinct items in one order';

  const merged = new Map();
  for (const item of items) {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(productId) || productId <= 0) { errors.items = 'Invalid product in cart'; break; }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errors.items = 'Quantities must be whole numbers between 1 and 99';
      break;
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }
  if ([...merged.values()].some((quantity) => quantity > 99)) {
    errors.items = 'You can order at most 99 units of a product';
  }

  const customer = body.customer ?? {};
  const normalized = {
    fullName: String(customer.fullName ?? '').trim(),
    phone: String(customer.phone ?? '').trim(),
    email: String(customer.email ?? '').trim().toLowerCase(),
    address: String(customer.address ?? '').trim(),
    city: String(customer.city ?? '').trim(),
    notes: String(customer.notes ?? '').trim(),
  };
  if (normalized.fullName.length < 2 || normalized.fullName.length > 100) errors['customer.fullName'] = 'Enter your full name';
  if (!PHONE_RE.test(normalized.phone)) errors['customer.phone'] = 'Enter a valid phone number';
  if (!EMAIL_RE.test(normalized.email)) errors['customer.email'] = 'Enter a valid email address';
  if (normalized.address.length < 5 || normalized.address.length > 255) errors['customer.address'] = 'Enter a delivery address';
  if (normalized.city.length < 2 || normalized.city.length > 80) errors['customer.city'] = 'Enter a city';
  if (normalized.notes.length > 500) errors['customer.notes'] = 'Notes must be 500 characters or fewer';

  const paymentMethod = body.paymentMethod;
  if (!['cod', 'card'].includes(paymentMethod)) errors.paymentMethod = 'Choose a payment method';
  if (paymentMethod === 'card') validateCard(body.card, errors);

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields', errors);
  return {
    lines: [...merged].map(([productId, quantity]) => ({ productId, quantity })),
    customer: normalized,
    paymentMethod,
  };
}

export function orderRoutes(db) {
  const router = Router();
  const requireUser = authenticate(db);
  const admin = [requireUser, requireRole('admin')];

  router.post('/', requireUser, requireRole('customer'), (req, res) => {
    const input = parseCheckout(req.body ?? {});
    const orderId = createOrder(db, { user: req.user, ...input });
    const order = findOrderById(db, orderId);
    res.status(201).json(order);
  });

  router.get('/my-orders', requireUser, (req, res) => {
    res.json(findOrders(db, { userId: req.user.id }));
  });

  router.get('/', ...admin, (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    if (status && !ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Unknown order status');
    res.json(findOrders(db, { status }));
  });

  router.get('/:id', requireUser, (req, res) => {
    const order = findOrderById(db, Number(req.params.id));
    // Customers only see their own orders; others get 404 to avoid revealing existence.
    if (!order || (req.user.role !== 'admin' && order.customer.userId !== req.user.id)) {
      throw new HttpError(404, 'Order not found');
    }
    res.json(order);
  });

  router.put('/:id/status', ...admin, (req, res) => {
    const status = req.body?.status;
    if (!ORDER_STATUSES.includes(status)) {
      throw new HttpError(400, 'Invalid status', { status: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }
    const id = Number(req.params.id);
    updateOrderStatus(db, id, status);
    res.json(findOrderById(db, id));
  });

  return router;
}
