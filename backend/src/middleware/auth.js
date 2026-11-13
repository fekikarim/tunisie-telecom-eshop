import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/errors.js';

/**
 * Verifies the Bearer token and loads the current user from the database,
 * so a deleted account or changed role takes effect immediately.
 */
export function authenticate(db) {
  const findUser = db.prepare(
    'SELECT id, name, email, phone, address, role FROM users WHERE id = ?'
  );
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(new HttpError(401, 'Please log in to continue'));
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = findUser.get(payload.sub);
      if (!user) return next(new HttpError(401, 'Your session is no longer valid'));
      req.user = user;
      return next();
    } catch {
      return next(new HttpError(401, 'Your session has expired, please log in again'));
    }
  };
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Please log in to continue'));
    if (req.user.role !== role) {
      return next(new HttpError(403, role === 'admin' ? 'Administrator access required' : 'This action is for customer accounts only'));
    }
    return next();
  };
}
