'use strict';

exports.up = async function (knex) {
  // Add visibility field to projects
  await knex.schema.alterTable('projects', (table) => {
    table.string('visibility', 20).notNullable().defaultTo('public');
  });

  // Create junction table for project–group visibility
  await knex.schema.createTable('project_groups', (table) => {
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.primary(['project_id', 'group_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('project_groups');
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('visibility');
  });
};
