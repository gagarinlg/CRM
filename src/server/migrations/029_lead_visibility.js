'use strict';

exports.up = async function (knex) {
  await knex.schema.alterTable('leads', (table) => {
    table.string('visibility', 20).notNullable().defaultTo('public');
  });

  await knex.schema.createTable('lead_groups', (table) => {
    table.uuid('lead_id').notNullable().references('id').inTable('leads').onDelete('CASCADE');
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.primary(['lead_id', 'group_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('lead_groups');
  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('visibility');
  });
};
