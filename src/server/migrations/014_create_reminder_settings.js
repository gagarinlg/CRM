'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('reminder_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').unique().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('email_notifications').defaultTo(true);
    table.integer('reminder_days_before').defaultTo(1);
    table.boolean('daily_digest').defaultTo(false);
    table.time('digest_time').defaultTo('08:00');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('contact_reminders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('remind_at').notNullable();
    table.text('note');
    table.boolean('is_completed').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('contact_reminders');
  await knex.schema.dropTableIfExists('reminder_settings');
};
