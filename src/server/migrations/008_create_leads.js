'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('lead_stages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).unique().notNullable();
    table.integer('order_index');
    table.boolean('is_default').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('leads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.decimal('value', 15, 2);
    table.integer('probability');
    table.string('stage', 100);
    table.string('source', 100);
    table.string('status', 50).defaultTo('open');
    table.uuid('company_id').nullable().references('id').inTable('companies').onDelete('SET NULL');
    table.uuid('contact_id').nullable().references('id').inTable('contacts').onDelete('SET NULL');
    table.uuid('assigned_to').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.check('?? between 0 and 100', ['probability']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('leads');
  await knex.schema.dropTableIfExists('lead_stages');
};
