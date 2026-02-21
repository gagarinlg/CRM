'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('company_id').nullable().references('id').inTable('companies').onDelete('SET NULL');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255);
    table.string('phone', 50);
    table.string('position', 100);
    table.text('notes');
    table.date('last_contact_date');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('contacts');
};
