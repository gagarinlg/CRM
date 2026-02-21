'use strict';

exports.up = async function (knex) {
  await knex.schema.table('notes', (table) => {
    table.boolean('is_pinned').notNullable().defaultTo(false);
    table.boolean('is_private').notNullable().defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.table('notes', (table) => {
    table.dropColumn('is_pinned');
    table.dropColumn('is_private');
  });
};
