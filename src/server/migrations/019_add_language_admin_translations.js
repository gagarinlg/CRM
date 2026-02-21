'use strict';

const NEW_KEYS = [
  // EN
  { language_code: 'en', key: 'profile.language', value: 'Interface Language', module: 'profile' },
  { language_code: 'en', key: 'profile.languageHint', value: 'This language will be used by default when you log in.', module: 'profile' },
  { language_code: 'en', key: 'translations.keys', value: 'Translation Keys', module: 'translations' },
  { language_code: 'en', key: 'translations.languages', value: 'Languages', module: 'translations' },
  { language_code: 'en', key: 'translations.newLanguage', value: 'New Language', module: 'translations' },
  { language_code: 'en', key: 'translations.editLanguage', value: 'Edit Language', module: 'translations' },
  { language_code: 'en', key: 'translations.langCode', value: 'Code', module: 'translations' },
  { language_code: 'en', key: 'translations.langName', value: 'Name', module: 'translations' },
  { language_code: 'en', key: 'translations.default', value: 'Default', module: 'translations' },
  { language_code: 'en', key: 'translations.deleteLanguageTitle', value: 'Delete Language', module: 'translations' },
  { language_code: 'en', key: 'translations.deleteLanguageMessage', value: 'Are you sure you want to delete this language? All its translations will also be deleted.', module: 'translations' },
  { language_code: 'en', key: 'common.active', value: 'Active', module: 'common' },
  { language_code: 'en', key: 'common.yes', value: 'Yes', module: 'common' },
  { language_code: 'en', key: 'common.no', value: 'No', module: 'common' },
  // DE
  { language_code: 'de', key: 'profile.language', value: 'Oberflächensprache', module: 'profile' },
  { language_code: 'de', key: 'profile.languageHint', value: 'Diese Sprache wird nach dem Einloggen automatisch verwendet.', module: 'profile' },
  { language_code: 'de', key: 'translations.keys', value: 'Übersetzungsschlüssel', module: 'translations' },
  { language_code: 'de', key: 'translations.languages', value: 'Sprachen', module: 'translations' },
  { language_code: 'de', key: 'translations.newLanguage', value: 'Neue Sprache', module: 'translations' },
  { language_code: 'de', key: 'translations.editLanguage', value: 'Sprache bearbeiten', module: 'translations' },
  { language_code: 'de', key: 'translations.langCode', value: 'Code', module: 'translations' },
  { language_code: 'de', key: 'translations.langName', value: 'Name', module: 'translations' },
  { language_code: 'de', key: 'translations.default', value: 'Standard', module: 'translations' },
  { language_code: 'de', key: 'translations.deleteLanguageTitle', value: 'Sprache löschen', module: 'translations' },
  { language_code: 'de', key: 'translations.deleteLanguageMessage', value: 'Sind Sie sicher, dass Sie diese Sprache löschen möchten?', module: 'translations' },
  { language_code: 'de', key: 'common.active', value: 'Aktiv', module: 'common' },
  { language_code: 'de', key: 'common.yes', value: 'Ja', module: 'common' },
  { language_code: 'de', key: 'common.no', value: 'Nein', module: 'common' },
  // CS
  { language_code: 'cs', key: 'profile.language', value: 'Jazyk rozhraní', module: 'profile' },
  { language_code: 'cs', key: 'profile.languageHint', value: 'Tento jazyk bude použit automaticky po přihlášení.', module: 'profile' },
  { language_code: 'cs', key: 'translations.keys', value: 'Překladové klíče', module: 'translations' },
  { language_code: 'cs', key: 'translations.languages', value: 'Jazyky', module: 'translations' },
  { language_code: 'cs', key: 'translations.newLanguage', value: 'Nový jazyk', module: 'translations' },
  { language_code: 'cs', key: 'translations.editLanguage', value: 'Upravit jazyk', module: 'translations' },
  { language_code: 'cs', key: 'translations.langCode', value: 'Kód', module: 'translations' },
  { language_code: 'cs', key: 'translations.langName', value: 'Název', module: 'translations' },
  { language_code: 'cs', key: 'translations.default', value: 'Výchozí', module: 'translations' },
  { language_code: 'cs', key: 'translations.deleteLanguageTitle', value: 'Smazat jazyk', module: 'translations' },
  { language_code: 'cs', key: 'translations.deleteLanguageMessage', value: 'Opravdu chcete tento jazyk smazat? Všechny jeho překlady budou také smazány.', module: 'translations' },
  { language_code: 'cs', key: 'common.active', value: 'Aktivní', module: 'common' },
  { language_code: 'cs', key: 'common.yes', value: 'Ano', module: 'common' },
  { language_code: 'cs', key: 'common.no', value: 'Ne', module: 'common' },
];

exports.up = async function (knex) {
  for (const row of NEW_KEYS) {
    await knex('translations').insert(row).onConflict(['language_code', 'key']).ignore();
  }
};

exports.down = async function (knex) {
  const keys = NEW_KEYS.map(r => r.key).filter((v, i, a) => a.indexOf(v) === i);
  await knex('translations').whereIn('key', keys).delete();
};
