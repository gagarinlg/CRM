'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('description');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('group_members', (table) => {
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.primary(['group_id', 'user_id']);
  });

  await knex.schema.createTable('group_roles', (table) => {
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.primary(['group_id', 'role_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('group_roles');
  await knex.schema.dropTableIfExists('group_members');
  await knex.schema.dropTableIfExists('groups');
};
