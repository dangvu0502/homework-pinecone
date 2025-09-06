<<<<<<< HEAD
import type { Knex } from "knex";

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3"
    }
  },

  staging: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },

  production: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};

export default config;
=======
import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite'
    },
    migrations: {
      directory: './src/migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './src/seeds'
    },
    useNullAsDefault: true
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL || './database.sqlite'
    },
    migrations: {
      directory: './src/migrations',
      extension: 'ts'
    },
    useNullAsDefault: true
  }
};

export default config;
>>>>>>> 29dae89 (BE002: Update server configuration and enhance chat/document routes with database integration)
