import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table (for future auth if needed)
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Documents table
  await knex.schema.createTable('documents', (table) => {
    table.increments('id').primary();
    table.integer('user_id').nullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('content_type', 100).notNullable();
    table.integer('size').notNullable();
    table.string('file_path', 500).notNullable();
    table.string('status', 20).defaultTo('uploaded');
    table.text('extracted_text').nullable();
    table.string('embedding_id').nullable();
    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at').nullable();
    
    table.index(['user_id']);
    table.index(['status']);
  });

  // Chat sessions table
  await knex.schema.createTable('chat_sessions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').nullable().references('id').inTable('users').onDelete('CASCADE');
    table.json('document_ids').defaultTo('[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
  });

  // Chat messages table
  await knex.schema.createTable('chat_messages', (table) => {
    table.increments('id').primary();
    table.integer('session_id').notNullable().references('id').inTable('chat_sessions').onDelete('CASCADE');
    table.string('role', 20).notNullable().checkIn(['user', 'assistant']);
    table.text('content').notNullable();
    table.json('sources').defaultTo('[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['session_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_sessions');
  await knex.schema.dropTableIfExists('documents');
  await knex.schema.dropTableIfExists('users');
}