'use strict';

exports.up = async (knex) => {
  await knex.schema.createTable('attachments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('entity_type', 50).notNullable(); // project | lead
    t.uuid('entity_id').notNullable();
    t.string('filename').notNullable();        // stored filename on disk
    t.string('original_name').notNullable();   // user-visible name
    t.string('mime_type', 255);
    t.bigInteger('size').defaultTo(0);         // bytes
    t.uuid('uploaded_by').references('users.id').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['entity_type', 'entity_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('attachments');
};
