'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('description');
    table.timestamp('start_datetime', { useTz: true }).notNullable();
    table.timestamp('end_datetime', { useTz: true }).notNullable();
    table.boolean('is_all_day').defaultTo(false);
    table.text('recurrence_rule');
    table.string('entity_type', 50);
    table.uuid('entity_id');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('event_reminders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('remind_at', { useTz: true }).notNullable();
    table.boolean('is_sent').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('event_reminders');
  await knex.schema.dropTableIfExists('events');
};
