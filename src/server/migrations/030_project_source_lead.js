'use strict';

exports.up = async function (knex) {
  await knex.schema.alterTable('projects', (table) => {
    table.uuid('source_lead_id').nullable().references('id').inTable('leads').onDelete('SET NULL');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('source_lead_id');
  });
};
