'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('companies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('address');
    table.string('phone', 50);
    table.string('email', 255);
    table.string('website', 255);
    table.string('industry', 100);
    table.string('size', 50);
    table.text('notes');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('companies');
};
