'use strict';

exports.up = async function (knex) {
  await knex.schema.table('users', (table) => {
    table.string('totp_secret', 64).nullable();
    table.boolean('totp_enabled').defaultTo(false).notNullable();
    // Stores JSON array of one-time backup codes (hashed)
    table.jsonb('totp_backup_codes').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.table('users', (table) => {
    table.dropColumn('totp_secret');
    table.dropColumn('totp_enabled');
    table.dropColumn('totp_backup_codes');
  });
};
