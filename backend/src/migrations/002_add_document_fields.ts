import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('documents', (table) => {
    table.text('error_message').nullable();
    table.integer('chunk_count').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('documents', (table) => {
    table.dropColumn('error_message');
    table.dropColumn('chunk_count');
  });
}