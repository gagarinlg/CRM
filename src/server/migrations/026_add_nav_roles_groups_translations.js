'use strict';

exports.up = async (knex) => {
  const translations = [
    { language_code: 'en', module: 'nav', key: 'nav.roles', value: 'Roles' },
    { language_code: 'en', module: 'nav', key: 'nav.groups', value: 'Groups' },
    { language_code: 'de', module: 'nav', key: 'nav.roles', value: 'Rollen' },
    { language_code: 'de', module: 'nav', key: 'nav.groups', value: 'Gruppen' },
    { language_code: 'cs', module: 'nav', key: 'nav.roles', value: 'Role' },
    { language_code: 'cs', module: 'nav', key: 'nav.groups', value: 'Skupiny' },
  ];
  for (const row of translations) {
    await knex('translations')
      .insert({ ...row, is_active: true })
      .onConflict(['language_code', 'key'])
      .ignore();
  }
};

exports.down = async (knex) => {
  await knex('translations')
    .whereIn('key', ['nav.roles', 'nav.groups'])
    .delete();
};
