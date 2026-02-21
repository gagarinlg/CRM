'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('content').notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').notNullable();
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['entity_type', 'entity_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notes');
};
