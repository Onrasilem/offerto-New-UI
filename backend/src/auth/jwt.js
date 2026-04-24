import jwt from 'jsonwebtoken';
import { loadConfig } from '../config.js';

const cfg = loadConfig();

export function signAccess(payload) {
  return jwt.sign(payload, cfg.jwtSecret, { expiresIn: cfg.accessTtl });
}

export function signRefresh(payload) {
  const expiresIn = `${cfg.refreshTtlDays}d`;
  return jwt.sign(payload, cfg.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, cfg.jwtSecret);
}
