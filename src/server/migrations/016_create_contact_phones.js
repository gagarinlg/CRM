'use strict';

/**
 * Create contact_phones table (multiple phone numbers per contact).
 * Also drops the single legacy `phone` column from contacts and migrates data.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('contact_phones', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    table.string('phone_number', 50).notNullable();
    // label: mobile | work | home | fax | other
    table.string('label', 20).notNullable().defaultTo('work');
    table.boolean('is_primary').defaultTo(false).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.index(['contact_id']);
  });

  // Migrate existing phone values into the new table
  const contacts = await knex('contacts').whereNotNull('phone').whereNot('phone', '').select('id', 'phone');
  if (contacts.length > 0) {
    await knex('contact_phones').insert(
      contacts.map((c) => ({
        contact_id: c.id,
        phone_number: c.phone,
        label: 'work',
        is_primary: true,
      })),
    );
  }

  // Drop legacy single-phone column
  await knex.schema.table('contacts', (table) => {
    table.dropColumn('phone');
  });

  // Make email required (NOT NULL) on contacts
  // We first set empty-string emails to NULL to avoid constraint failure
  await knex('contacts').where('email', '').update({ email: null });
  await knex.schema.alterTable('contacts', (table) => {
    table.string('email', 255).notNullable().alter();
  });
};

exports.down = async function (knex) {
  // Restore email as nullable
  await knex.schema.alterTable('contacts', (table) => {
    table.string('email', 255).nullable().alter();
  });

  // Re-add phone column and copy primary phone back
  await knex.schema.table('contacts', (table) => {
    table.string('phone', 50).nullable();
  });
  const primaryPhones = await knex('contact_phones').where({ is_primary: true }).select('contact_id', 'phone_number');
  for (const row of primaryPhones) {
    await knex('contacts').where({ id: row.contact_id }).update({ phone: row.phone_number });
  }

  await knex.schema.dropTableIfExists('contact_phones');
};
