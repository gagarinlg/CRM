'use strict';

const KEYS = [
  // Reports section - labels used in ReportsPage dropdown
  { module: 'reports', key: 'reports.sales',
    en: 'Sales Report', de: 'Umsatzbericht', cs: 'Zpráva o prodeji' },
  { module: 'reports', key: 'reports.leadPipeline',
    en: 'Lead Pipeline', de: 'Lead-Pipeline', cs: 'Přehled leadů' },
  { module: 'reports', key: 'reports.projectStatus',
    en: 'Project Status', de: 'Projektstatus', cs: 'Stav projektů' },
  { module: 'reports', key: 'reports.contactActivity',
    en: 'Contact Activity', de: 'Kontaktaktivität', cs: 'Aktivita kontaktů' },
  { module: 'reports', key: 'reports.userActivity',
    en: 'User Activity', de: 'Benutzeraktivität', cs: 'Aktivita uživatelů' },
  { module: 'reports', key: 'reports.noData',
    en: 'No report data available.', de: 'Keine Berichtsdaten verfügbar.', cs: 'Žádná data zprávy.' },
  // Project visibility
  { module: 'projects', key: 'projects.visibility',
    en: 'Visibility', de: 'Sichtbarkeit', cs: 'Viditelnost' },
  { module: 'projects', key: 'projects.visibilityPublic',
    en: 'Public (all users)', de: 'Öffentlich (alle Benutzer)', cs: 'Veřejný (všichni uživatelé)' },
  { module: 'projects', key: 'projects.visibilityRestricted',
    en: 'Restricted (selected groups only)', de: 'Eingeschränkt (nur ausgewählte Gruppen)', cs: 'Omezený (pouze vybrané skupiny)' },
  { module: 'projects', key: 'projects.groups',
    en: 'Access Groups', de: 'Zugriffsgruppen', cs: 'Skupiny přístupu' },
  { module: 'projects', key: 'projects.groupsHint',
    en: 'Only members of these groups can see this project.',
    de: 'Nur Mitglieder dieser Gruppen können dieses Projekt sehen.',
    cs: 'Tento projekt mohou vidět pouze členové těchto skupin.' },
  { module: 'projects', key: 'projects.company',
    en: 'Company', de: 'Unternehmen', cs: 'Společnost' },
  // Notes additional keys
  { module: 'notes', key: 'notes.addNote',
    en: 'Add Note', de: 'Notiz hinzufügen', cs: 'Přidat poznámku' },
  { module: 'notes', key: 'notes.editNote',
    en: 'Edit Note', de: 'Notiz bearbeiten', cs: 'Upravit poznámku' },
  { module: 'notes', key: 'notes.noNotes',
    en: 'No notes yet. Add the first note.', de: 'Noch keine Notizen. Erste Notiz hinzufügen.', cs: 'Zatím žádné poznámky. Přidejte první poznámku.' },
  { module: 'notes', key: 'notes.typeGeneral',
    en: 'General', de: 'Allgemein', cs: 'Obecné' },
  { module: 'notes', key: 'notes.typeCall',
    en: 'Call', de: 'Anruf', cs: 'Telefonát' },
  { module: 'notes', key: 'notes.typeMeeting',
    en: 'Meeting', de: 'Besprechung', cs: 'Schůzka' },
  { module: 'notes', key: 'notes.typeEmail',
    en: 'Email', de: 'E-Mail', cs: 'E-mail' },
  { module: 'notes', key: 'notes.typeTask',
    en: 'Task', de: 'Aufgabe', cs: 'Úkol' },
  // Common additions
  { module: 'common', key: 'common.info',
    en: 'Info', de: 'Info', cs: 'Info' },
  { module: 'common', key: 'common.addedBy',
    en: 'Added by', de: 'Hinzugefügt von', cs: 'Přidal' },
];

exports.up = async function (knex) {
  const rows = [];
  for (const entry of KEYS) {
    for (const lang of ['en', 'de', 'cs']) {
      rows.push({
        language_code: lang,
        module: entry.module,
        key: entry.key,
        value: entry[lang],
      });
    }
  }

  await knex('translations')
    .insert(rows)
    .onConflict(['language_code', 'key'])
    .ignore();
};

exports.down = async function (knex) {
  const keys = KEYS.map(k => k.key);
  await knex('translations').whereIn('key', keys).delete();
};
