'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('languages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code', 10).unique().notNullable();
    table.string('name', 100).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_default').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('language_code', 10).notNullable();
    table.string('key', 500).notNullable();
    table.text('value').notNullable();
    table.string('module', 100);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['language_code', 'key']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('translations');
  await knex.schema.dropTableIfExists('languages');
};
