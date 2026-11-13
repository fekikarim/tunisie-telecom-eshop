import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { HttpError } from '../utils/errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', address: u.address ?? '', role: u.role,
});

const issueToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export function authRoutes(db) {
  const router = Router();
  const findByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, 'customer')"
  );
  const requireUser = authenticate(db);

  router.post('/register', (req, res) => {
    const body = req.body ?? {};
    const errors = {};
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const phone = String(body.phone ?? '').trim();
    const address = String(body.address ?? '').trim();

    if (name.length < 2 || name.length > 80) errors.name = 'Name must be between 2 and 80 characters';
    if (!EMAIL_RE.test(email) || email.length > 120) errors.email = 'Enter a valid email address';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must be at least 8 characters and contain a letter and a number';
    }
    if (phone && !PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number';
    if (address.length > 255) errors.address = 'Address is too long';
    if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields', errors);

    if (findByEmail.get(email)) {
      throw new HttpError(409, 'An account with this email already exists', { email: 'This email is already registered' });
    }
    const info = insertUser.run(name, email, bcrypt.hashSync(password, 10), phone || null, address || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  });

  router.post('/login', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!email || !password) throw new HttpError(400, 'Email and password are required');

    const user = findByEmail.get(email);
    // Same message for unknown email and wrong password to avoid account enumeration.
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new HttpError(401, 'Invalid email or password');
    }
    res.json({ token: issueToken(user), user: publicUser(user) });
  });

  router.get('/me', requireUser, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  return router;
}
