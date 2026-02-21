'use strict';

const keys = [
  { language_code: 'en', key: 'leads.title_field', value: 'Title',  module: 'leads' },
  { language_code: 'de', key: 'leads.title_field', value: 'Titel',  module: 'leads' },
  { language_code: 'cs', key: 'leads.title_field', value: 'Název',  module: 'leads' },
];

exports.up = async (knex) => {
  for (const row of keys) {
    await knex('translations').insert(row).onConflict(['language_code', 'key']).ignore();
  }
};

exports.down = async (knex) => {
  await knex('translations').where('key', 'leads.title_field').delete();
};
