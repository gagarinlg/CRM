'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable();
    table.string('action', 100).notNullable();
    table.string('entity_type', 100);
    table.uuid('entity_id').nullable();
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['entity_type', 'entity_id']);
    table.index(['created_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
