import knex from 'knex';
import { logger } from '../utils/logger.js';
import config from '../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

if (!knexConfig) {
  throw new Error(`No database configuration found for environment: ${environment}`);
}

const db = knex(knexConfig);

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    // Use SQLite compatible query
    await db.raw('SELECT 1 as test');
    logger.info('Database connection successful');
    return true;
  } catch (error: any) {
    logger.error('Database connection failed', {
      error: error.message,
      code: error.code
    });
    return false;
  }
};

// Run migrations
export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Running database migrations...');
    await db.migrate.latest();
    logger.info('Database migrations completed successfully');
  } catch (error: any) {
    logger.error('Database migration failed', { error: error.message });
    throw error;
  }
};

// Graceful shutdown
export const closeConnection = async (): Promise<void> => {
  await db.destroy();
  logger.info('Database connection closed');
};

export { db };