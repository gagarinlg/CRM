'use strict';

const KEYS = [
  { module: 'leads', key: 'members',      en: 'Members',         de: 'Mitglieder',  cs: 'Členové' },
  { module: 'leads', key: 'addMember',    en: 'Add Member',      de: 'Mitglied hinzufügen', cs: 'Přidat člena' },
  { module: 'leads', key: 'addContact',   en: 'Add Contact',     de: 'Kontakt hinzufügen',  cs: 'Přidat kontakt' },
  { module: 'leads', key: 'removeMember', en: 'Remove Member',   de: 'Mitglied entfernen',  cs: 'Odebrat člena' },
  { module: 'leads', key: 'removeContact',en: 'Remove Contact',  de: 'Kontakt entfernen',   cs: 'Odebrat kontakt' },
  { module: 'projects', key: 'addMember', en: 'Add Member',      de: 'Mitglied hinzufügen', cs: 'Přidat člena' },
  { module: 'projects', key: 'addContact',en: 'Add Contact',     de: 'Kontakt hinzufügen',  cs: 'Přidat kontakt' },
  { module: 'projects', key: 'removeMember', en: 'Remove Member',de: 'Mitglied entfernen',  cs: 'Odebrat člena' },
  { module: 'projects', key: 'removeContact', en: 'Remove Contact', de: 'Kontakt entfernen', cs: 'Odebrat kontakt' },
];

const LANGS = ['en', 'de', 'cs'];

exports.up = async (knex) => {
  const rows = [];
  for (const k of KEYS) {
    for (const lang of LANGS) {
      rows.push({ language_code: lang, module: k.module, key: `${k.module}.${k.key}`, value: k[lang] });
    }
  }
  await knex('translations').insert(rows).onConflict(['language_code', 'key']).ignore();
};

exports.down = async (knex) => {
  const keys = KEYS.map(k => `${k.module}.${k.key}`);
  await knex('translations').whereIn('key', keys).delete();
};
