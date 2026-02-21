'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('tags', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable();
    t.string('color', 20).defaultTo('#6b7280');
    t.timestamps(true, true);
    t.unique('name');
  });

  await knex.schema.createTable('entity_tags', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('entity_type', 50).notNullable();
    t.uuid('entity_id').notNullable();
    t.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
    t.timestamps(true, true);
    t.unique(['entity_type', 'entity_id', 'tag_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('entity_tags');
  await knex.schema.dropTableIfExists('tags');
};
