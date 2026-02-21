'use strict';

exports.up = async function (knex) {
  // Companies: add address detail and tax columns
  await knex.schema.alterTable('companies', (table) => {
    table.string('city', 100);
    table.string('country', 100);
    table.string('postal_code', 20);
    table.string('vat_number', 50);
  });

  // Notes: add a type / category column
  await knex.schema.alterTable('notes', (table) => {
    table.string('type', 50).defaultTo('general');
  });

  // Projects: add progress percentage
  await knex.schema.alterTable('projects', (table) => {
    table.integer('progress').defaultTo(0);
  });

  // Leads: add free-text notes field
  await knex.schema.alterTable('leads', (table) => {
    table.text('notes');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('city');
    table.dropColumn('country');
    table.dropColumn('postal_code');
    table.dropColumn('vat_number');
  });

  await knex.schema.alterTable('notes', (table) => {
    table.dropColumn('type');
  });

  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('progress');
  });

  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('notes');
  });
};
