import knex from 'knex';
import { logger } from '../utils/logger.ts';
import config from '../knexfile.ts';

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

// Check if migrations are needed
export const checkMigrations = async (): Promise<boolean> => {
  try {
    const [completed, pending] = await Promise.all([
      db.migrate.list({ directory: db.client.config.migrations.directory }),
      db.migrate.list({ directory: db.client.config.migrations.directory })
    ]);
    
    return pending[1].length > 0;
  } catch (error: any) {
    logger.error('Failed to check migration status', { error: error.message });
    return false;
  }
};

// Run migrations
export const runMigrations = async (): Promise<void> => {
  try {
    // Check if there are pending migrations first
    const [, pending] = await db.migrate.list();
    
    if (pending.length === 0) {
      logger.info('Database is up to date, no migrations needed');
      return;
    }
    
    logger.info(`Running ${pending.length} pending migration(s)...`);
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