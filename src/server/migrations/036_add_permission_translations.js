'use strict';

// Human-readable labels for every permission in the system.
// The frontend uses t(`permissions.${p.name}`, p.description) to show these.
const KEYS = [
  // contacts
  { key: 'permissions.contacts.read',    en: 'View Contacts',            de: 'Kontakte anzeigen',              cs: 'Zobrazit kontakty' },
  { key: 'permissions.contacts.write',   en: 'Create / Edit Contacts',   de: 'Kontakte erstellen/bearbeiten',  cs: 'Vytvářet/upravovat kontakty' },
  { key: 'permissions.contacts.delete',  en: 'Delete Contacts',          de: 'Kontakte löschen',               cs: 'Mazat kontakty' },
  { key: 'permissions.contacts.admin',   en: 'Full Contacts Admin',      de: 'Vollzugriff Kontakte',           cs: 'Plná správa kontaktů' },
  // companies
  { key: 'permissions.companies.read',   en: 'View Companies',           de: 'Unternehmen anzeigen',           cs: 'Zobrazit společnosti' },
  { key: 'permissions.companies.write',  en: 'Create / Edit Companies',  de: 'Unternehmen erstellen/bearbeiten', cs: 'Vytvářet/upravovat společnosti' },
  { key: 'permissions.companies.delete', en: 'Delete Companies',         de: 'Unternehmen löschen',            cs: 'Mazat společnosti' },
  { key: 'permissions.companies.admin',  en: 'Full Companies Admin',     de: 'Vollzugriff Unternehmen',        cs: 'Plná správa společností' },
  // projects
  { key: 'permissions.projects.read',    en: 'View Projects',            de: 'Projekte anzeigen',              cs: 'Zobrazit projekty' },
  { key: 'permissions.projects.write',   en: 'Create / Edit Projects',   de: 'Projekte erstellen/bearbeiten',  cs: 'Vytvářet/upravovat projekty' },
  { key: 'permissions.projects.delete',  en: 'Delete Projects',          de: 'Projekte löschen',               cs: 'Mazat projekty' },
  { key: 'permissions.projects.admin',   en: 'Full Projects Admin',      de: 'Vollzugriff Projekte',           cs: 'Plná správa projektů' },
  // leads
  { key: 'permissions.leads.read',       en: 'View Leads',               de: 'Leads anzeigen',                 cs: 'Zobrazit leady' },
  { key: 'permissions.leads.write',      en: 'Create / Edit Leads',      de: 'Leads erstellen/bearbeiten',     cs: 'Vytvářet/upravovat leady' },
  { key: 'permissions.leads.delete',     en: 'Delete Leads',             de: 'Leads löschen',                  cs: 'Mazat leady' },
  { key: 'permissions.leads.admin',      en: 'Full Leads Admin',         de: 'Vollzugriff Leads',              cs: 'Plná správa leadů' },
  // notes
  { key: 'permissions.notes.read',       en: 'View Notes',               de: 'Notizen anzeigen',               cs: 'Zobrazit poznámky' },
  { key: 'permissions.notes.write',      en: 'Create / Edit Notes',      de: 'Notizen erstellen/bearbeiten',   cs: 'Vytvářet/upravovat poznámky' },
  { key: 'permissions.notes.delete',     en: 'Delete Notes',             de: 'Notizen löschen',                cs: 'Mazat poznámky' },
  // calendar
  { key: 'permissions.calendar.read',    en: 'View Calendar',            de: 'Kalender anzeigen',              cs: 'Zobrazit kalendář' },
  { key: 'permissions.calendar.write',   en: 'Create / Edit Events',     de: 'Ereignisse erstellen/bearbeiten', cs: 'Vytvářet/upravovat události' },
  { key: 'permissions.calendar.delete',  en: 'Delete Events',            de: 'Ereignisse löschen',             cs: 'Mazat události' },
  // reports
  { key: 'permissions.reports.read',     en: 'View Reports',             de: 'Berichte anzeigen',              cs: 'Zobrazit přehledy' },
  { key: 'permissions.reports.generate', en: 'Generate / Export Reports',de: 'Berichte erstellen/exportieren', cs: 'Generovat/exportovat přehledy' },
  // users
  { key: 'permissions.users.read',       en: 'View Users',               de: 'Benutzer anzeigen',              cs: 'Zobrazit uživatele' },
  { key: 'permissions.users.write',      en: 'Create / Edit Users',      de: 'Benutzer erstellen/bearbeiten',  cs: 'Vytvářet/upravovat uživatele' },
  { key: 'permissions.users.delete',     en: 'Delete Users',             de: 'Benutzer löschen',               cs: 'Mazat uživatele' },
  { key: 'permissions.users.admin',      en: 'Full Users Admin',         de: 'Vollzugriff Benutzer',           cs: 'Plná správa uživatelů' },
  // settings
  { key: 'permissions.settings.read',    en: 'View Settings',            de: 'Einstellungen anzeigen',         cs: 'Zobrazit nastavení' },
  { key: 'permissions.settings.write',   en: 'Edit Settings',            de: 'Einstellungen bearbeiten',       cs: 'Upravit nastavení' },
  // reports.summary (used in ReportsPage)
  { key: 'reports.summary',              en: 'Summary',                  de: 'Zusammenfassung',                cs: 'Souhrn' },
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
  const keys = KEYS.map(k => k.key);
  await knex('translations').whereIn('key', keys).delete();
};
