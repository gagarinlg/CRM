'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('status', 50).defaultTo('active');
    table.date('start_date');
    table.date('end_date');
    table.decimal('budget', 15, 2);
    table.uuid('company_id').nullable().references('id').inTable('companies').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });
  });

  await knex.schema.createTable('project_contacts', (table) => {
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    table.primary(['project_id', 'contact_id']);
  });

  await knex.schema.createTable('project_members', (table) => {
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role', 50);
    table.primary(['project_id', 'user_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('project_members');
  await knex.schema.dropTableIfExists('project_contacts');
  await knex.schema.dropTableIfExists('projects');
};
