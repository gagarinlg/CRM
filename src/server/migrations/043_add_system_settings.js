'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('system_settings', (table) => {
    table.string('key', 100).primary();
    table.text('value').nullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  // Insert defaults
  await knex('system_settings').insert([
    { key: 'calendar_week_start', value: '1' },     // 1 = Monday
    { key: 'calendar_week_numbers', value: 'false' },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('system_settings');
};
