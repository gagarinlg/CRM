'use strict';

exports.up = async function (knex) {
  await knex.schema.table('users', (table) => {
    // 0 = Sunday, 1 = Monday; null = use system default
    table.integer('week_start').nullable().defaultTo(null);
    table.boolean('show_week_numbers').notNullable().defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.table('users', (table) => {
    table.dropColumn('week_start');
    table.dropColumn('show_week_numbers');
  });
};
