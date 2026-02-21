'use strict';

const KEYS = [
  { key: 'users.username',               module: 'users',       en: 'Username',                           de: 'Benutzername',                          cs: 'Uživatelské jméno' },
  { key: 'validation.usernameRequired',  module: 'validation',  en: 'Username is required',               de: 'Benutzername ist erforderlich',         cs: 'Uživatelské jméno je povinné' },
  { key: 'validation.usernameMinLength', module: 'validation',  en: 'Username must be at least 3 characters', de: 'Benutzername muss mindestens 3 Zeichen lang sein', cs: 'Uživatelské jméno musí mít alespoň 3 znaky' },
];

const LANGS = ['en', 'de', 'cs'];

exports.up = async (knex) => {
  const rows = [];
  for (const k of KEYS) {
    for (const lang of LANGS) {
      rows.push({ language_code: lang, module: k.module, key: k.key, value: k[lang] });
    }
  }
  await knex('translations').insert(rows).onConflict(['language_code', 'key']).ignore();
};

exports.down = async (knex) => {
  await knex('translations').whereIn('key', KEYS.map(k => k.key)).delete();
};
