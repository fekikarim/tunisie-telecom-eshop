import { Router } from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/errors.js';

const MIME_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.uploadDir),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${MIME_EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!MIME_EXT[file.mimetype]) return cb(new HttpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed'));
    return cb(null, true);
  },
});

export function uploadRoutes(db) {
  const router = Router();
  router.post(
    '/product-image',
    authenticate(db),
    requireRole('admin'),
    upload.single('image'),
    (req, res) => {
      if (!req.file) throw new HttpError(400, 'Please choose an image to upload');
      res.status(201).json({ url: `/uploads/${req.file.filename}` });
    }
  );
  return router;
}
