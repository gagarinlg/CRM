'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('email_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).unique().notNullable();
    table.string('subject', 500);
    table.text('html_body');
    table.text('text_body');
    table.jsonb('variables').defaultTo('[]');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('smtp_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('host', 255);
    table.integer('port');
    table.string('username', 255);
    table.text('password_encrypted');
    table.string('from_address', 255);
    table.string('from_name', 255);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('email_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('to_address', 255).notNullable();
    table.string('subject', 500);
    table.text('html_body');
    table.string('status', 50).defaultTo('pending');
    table.text('error_message');
    table.timestamp('sent_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('email_logs');
  await knex.schema.dropTableIfExists('smtp_settings');
  await knex.schema.dropTableIfExists('email_templates');
};
