'use strict';

exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('preferred_language', 10).nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('preferred_language');
  });
};
