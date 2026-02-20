'use strict';

exports.up = async (knex) => {
  await knex.schema.alterTable('events', (t) => {
    t.string('type', 50).defaultTo('meeting');
    t.text('location');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('events', (t) => {
    t.dropColumn('type');
    t.dropColumn('location');
  });
};
