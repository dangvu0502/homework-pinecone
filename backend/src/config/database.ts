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
  } catch (error: unknown) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? (error as Error & { code: string }).code : undefined
    });
    return false;
  }
};

// Check if migrations are needed
export const checkMigrations = async (): Promise<boolean> => {
  try {
    const [, pending] = await db.migrate.list();
    
    return pending.length > 0;
  } catch (error: unknown) {
    logger.error('Failed to check migration status', { error: error instanceof Error ? error.message : 'Unknown error' });
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
  } catch (error: unknown) {
    logger.error('Database migration failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
};

// Graceful shutdown
export const closeConnection = async (): Promise<void> => {
  await db.destroy();
  logger.info('Database connection closed');
};

export { db };