import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('documents', (table) => {
    table.text('summary').nullable();
    table.timestamp('summary_generated_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('documents', (table) => {
    table.dropColumn('summary');
    table.dropColumn('summary_generated_at');
  });
}