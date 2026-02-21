'use strict';

const KEYS = [
  // validation module — Yup schema error messages used across all forms
  { key: 'validation.firstNameRequired',      module: 'validation', en: 'First name is required',               de: 'Vorname ist erforderlich',                        cs: 'Jméno je povinné' },
  { key: 'validation.lastNameRequired',       module: 'validation', en: 'Last name is required',                de: 'Nachname ist erforderlich',                       cs: 'Příjmení je povinné' },
  { key: 'validation.nameRequired',           module: 'validation', en: 'Name is required',                     de: 'Name ist erforderlich',                           cs: 'Název je povinný' },
  { key: 'validation.titleRequired',          module: 'validation', en: 'Title is required',                    de: 'Titel ist erforderlich',                          cs: 'Název je povinný' },
  { key: 'validation.eventTitleRequired',     module: 'validation', en: 'Event title is required',              de: 'Ereignistitel ist erforderlich',                  cs: 'Název události je povinný' },
  { key: 'validation.emailRequired',          module: 'validation', en: 'Email is required',                    de: 'E-Mail ist erforderlich',                         cs: 'E-mail je povinný' },
  { key: 'validation.emailInvalid',           module: 'validation', en: 'Invalid email address',                de: 'Ungültige E-Mail-Adresse',                        cs: 'Neplatná e-mailová adresa' },
  { key: 'validation.websiteInvalid',         module: 'validation', en: 'Invalid website URL',                  de: 'Ungültige Website-URL',                           cs: 'Neplatná adresa webu' },
  { key: 'validation.passwordRequired',       module: 'validation', en: 'Password is required',                 de: 'Passwort ist erforderlich',                       cs: 'Heslo je povinné' },
  { key: 'validation.passwordMinLength',      module: 'validation', en: 'Password must be at least 8 characters', de: 'Das Passwort muss mindestens 8 Zeichen lang sein', cs: 'Heslo musí mít alespoň 8 znaků' },
  { key: 'validation.currentPasswordRequired', module: 'validation', en: 'Current password is required',        de: 'Aktuelles Passwort ist erforderlich',             cs: 'Současné heslo je povinné' },
  { key: 'validation.newPasswordRequired',    module: 'validation', en: 'New password is required',             de: 'Neues Passwort ist erforderlich',                 cs: 'Nové heslo je povinné' },
  { key: 'validation.confirmPasswordRequired', module: 'validation', en: 'Please confirm your password',        de: 'Bitte bestätigen Sie Ihr Passwort',               cs: 'Prosím potvrďte heslo' },
  { key: 'validation.identifierRequired',     module: 'validation', en: 'Email or username is required',        de: 'E-Mail oder Benutzername ist erforderlich',       cs: 'E-mail nebo uživatelské jméno je povinné' },
  { key: 'validation.totpRequired',           module: 'validation', en: 'Authentication code is required',      de: 'Authentifizierungscode ist erforderlich',         cs: 'Ověřovací kód je povinný' },
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
