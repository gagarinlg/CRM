'use strict';

const KEYS = [
  { key: 'projects.notFound', en: 'Project not found.', de: 'Projekt nicht gefunden.', cs: 'Projekt nebyl nalezen.' },
  { key: 'leads.notFound',    en: 'Lead not found.',    de: 'Lead nicht gefunden.',    cs: 'Lead nebyl nalezen.' },
];

const LANGS = ['en', 'de', 'cs'];

exports.up = async (knex) => {
  const rows = [];
  for (const k of KEYS) {
    const module = k.key.split('.')[0];
    for (const lang of LANGS) {
      rows.push({ language_code: lang, module, key: k.key, value: k[lang] });
    }
  }
  await knex('translations').insert(rows).onConflict(['language_code', 'key']).ignore();
};

exports.down = async (knex) => {
  await knex('translations').whereIn('key', KEYS.map(k => k.key)).delete();
};
