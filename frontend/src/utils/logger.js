/**
 * logger.js
 * Centralised logger — wraps console methods so we can
 * toggle verbosity or swap to a remote logging service later
 * without touching call-sites.
 *
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.info('NodeX mounted', { id });
 *   logger.warn('Missing field', { field });
 *   logger.error('Fetch failed', error);
 */

const isDev = process.env.NODE_ENV === 'development';

const logger = {
  info: (message, ...args) => {
    if (isDev) console.info(`[INFO]  ${message}`, ...args);
  },
  warn: (message, ...args) => {
    if (isDev) console.warn(`[WARN]  ${message}`, ...args);
  },
  error: (message, ...args) => {
    // Always log errors, even in production
    console.error(`[ERROR] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (isDev) console.debug(`[DEBUG] ${message}`, ...args);
  },
};

export default logger;