'use strict';

/**
 * Migration 017 – Fix translation keys for existing installations.
 *
 * Two problems fixed:
 *  1. The seed stored navigation labels under module "navigation" producing keys
 *     like "navigation.companies".  All frontend components use "nav.*", so
 *     every navigation label showed as a raw key.  Rename all rows.
 *
 *  2. Several modules were entirely missing from the seed (errors, groups,
 *     profile, roles, translations) and many keys were absent in existing
 *     modules.  Insert all missing rows with ON CONFLICT DO NOTHING so the
 *     migration is safe to re-run.
 */

const { v4: uuidv4 } = require('uuid');

// All keys that should exist after this migration, indexed by language code.
// Only keys that were MISSING from the original seed are listed here; the
// rename in step 1 handles the navigation→nav rename.
const MISSING = {
  en: {
    // nav module – inserted fresh after the rename; these are the same values
    // that were in "navigation.*" so they will be skipped by ON CONFLICT.
    nav: {
      dashboard: 'Dashboard', companies: 'Companies', contacts: 'Contacts',
      projects: 'Projects', leads: 'Leads', notes: 'Notes',
      calendar: 'Calendar', reports: 'Reports', settings: 'Settings',
      users: 'Users', admin: 'Admin', profile: 'Profile', help: 'Help',
    },
    common: {
      view: 'View', notes: 'Notes', relatedTo: 'Related To',
      confirmMessage: 'Are you sure? This action cannot be undone.',
      noData: 'No data available.', noNotes: 'No notes yet.', empty: 'Empty',
    },
    errors: {
      fetchFailed: 'Failed to load data.', saveFailed: 'Failed to save.',
      deleteFailed: 'Failed to delete.', notFound: 'Not found.',
      forbidden: 'Access denied.', required: 'This field is required.',
    },
    companies: {
      new: 'New Company', edit: 'Edit Company', name: 'Company Name',
      email: 'Email', city: 'City', country: 'Country', postalCode: 'Postal Code',
      vatNumber: 'VAT Number', details: 'Company Details',
      deleteTitle: 'Delete Company',
      deleteMessage: 'Are you sure you want to delete this company?',
    },
    contacts: {
      new: 'New Contact', edit: 'Edit Contact', name: 'Name',
      email: 'Email', phone: 'Phone', jobTitle: 'Job Title',
      company: 'Company', address: 'Address', city: 'City', country: 'Country',
      status: 'Status', lastContact: 'Last Contact', notes: 'Notes',
      details: 'Contact Details',
      deleteTitle: 'Delete Contact',
      deleteMessage: 'Are you sure you want to delete this contact?',
    },
    projects: {
      new: 'New Project', edit: 'Edit Project', name: 'Project Name',
      status: 'Status', progress: 'Progress', members: 'Members',
      details: 'Project Details',
      deleteTitle: 'Delete Project',
      deleteMessage: 'Are you sure you want to delete this project?',
    },
    leads: {
      new: 'New Lead', edit: 'Edit Lead',
      company: 'Company', contact: 'Contact', details: 'Lead Details',
      deleteTitle: 'Delete Lead',
      deleteMessage: 'Are you sure you want to delete this lead?',
    },
    notes: {
      new: 'New Note', content: 'Note Content', type: 'Related To',
      deleteTitle: 'Delete Note',
      deleteMessage: 'Are you sure you want to delete this note?',
    },
    calendar: {
      newEvent: 'New Event', eventType: 'Event Type', location: 'Location',
      deleteTitle: 'Delete Event',
      deleteMessage: 'Are you sure you want to delete this event?',
    },
    dashboard: {
      noActivity: 'No recent activity.', overdueContacts: 'Overdue Contacts',
      noOverdue: 'No overdue contacts.', overdue: 'Overdue',
      revenue: 'Revenue Pipeline', leadConversion: 'Lead Conversion',
      projectStatus: 'Project Status',
    },
    reports: {
      generate: 'Generate Report', download: 'Download',
      selectReport: 'Select Report Type',
      startDate: 'Start Date', endDate: 'End Date',
      filters: 'Filters', data: 'Report Data',
    },
    settings: {
      system: 'System Settings', smtp: 'Email (SMTP)',
      smtpPassword: 'SMTP Password', smtpFromName: 'From Name',
      smtpSaved: 'Email settings saved.', testSmtp: 'Test Connection',
      smtpTestSuccess: 'SMTP connection successful.',
      smtpTestFailed: 'SMTP connection failed.',
      reminders: 'Reminders',
      overdueContactDays: 'Days before overdue contact reminder',
      emailReminderDays: 'Days before event email reminder',
    },
    users: {
      new: 'New User', edit: 'Edit User', name: 'Name',
      firstName: 'First Name', lastName: 'Last Name',
      email: 'Email', password: 'Password', newPassword: 'New Password',
      role: 'Role', status: 'Status', active: 'Active', inactive: 'Inactive',
      deleteTitle: 'Delete User',
      deleteMessage: 'Are you sure you want to delete this user?',
    },
    roles: {
      title: 'Roles', new: 'New Role', edit: 'Edit Role',
      name: 'Role Name', description: 'Description', permissions: 'Permissions',
      deleteTitle: 'Delete Role',
      deleteMessage: 'Are you sure you want to delete this role?',
    },
    groups: {
      title: 'Groups', new: 'New Group', edit: 'Edit Group',
      name: 'Group Name', description: 'Description', members: 'Members',
      deleteTitle: 'Delete Group',
      deleteMessage: 'Are you sure you want to delete this group?',
    },
    profile: {
      title: 'Profile', personalInfo: 'Personal Information',
      changePassword: 'Change Password', currentPassword: 'Current Password',
      newPassword: 'New Password', confirmPassword: 'Confirm New Password',
      passwordChanged: 'Password changed successfully.', saved: 'Profile saved.',
    },
    translations: {
      title: 'Translations', new: 'New Translation', edit: 'Edit Translation',
      key: 'Key', value: 'Value', language: 'Language', module: 'Module',
      searchKeys: 'Search keys…',
      deleteTitle: 'Delete Translation',
      deleteMessage: 'Are you sure you want to delete this translation?',
    },
  },

  de: {
    nav: {
      dashboard: 'Dashboard', companies: 'Unternehmen', contacts: 'Kontakte',
      projects: 'Projekte', leads: 'Leads', notes: 'Notizen',
      calendar: 'Kalender', reports: 'Berichte', settings: 'Einstellungen',
      users: 'Benutzer', admin: 'Administration', profile: 'Profil', help: 'Hilfe',
    },
    common: {
      view: 'Ansehen', notes: 'Notizen', relatedTo: 'Bezieht sich auf',
      confirmMessage: 'Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.',
      noData: 'Keine Daten verfügbar.', noNotes: 'Noch keine Notizen.', empty: 'Leer',
    },
    errors: {
      fetchFailed: 'Daten konnten nicht geladen werden.',
      saveFailed: 'Speichern fehlgeschlagen.',
      deleteFailed: 'Löschen fehlgeschlagen.',
      notFound: 'Nicht gefunden.', forbidden: 'Zugriff verweigert.',
      required: 'Dieses Feld ist erforderlich.',
    },
    companies: {
      new: 'Neues Unternehmen', edit: 'Unternehmen bearbeiten',
      name: 'Unternehmensname', email: 'E-Mail',
      city: 'Stadt', country: 'Land', postalCode: 'Postleitzahl',
      vatNumber: 'Umsatzsteuer-ID', details: 'Unternehmensdetails',
      deleteTitle: 'Unternehmen löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie dieses Unternehmen löschen möchten?',
    },
    contacts: {
      new: 'Neuer Kontakt', edit: 'Kontakt bearbeiten', name: 'Name',
      email: 'E-Mail', phone: 'Telefon', jobTitle: 'Berufsbezeichnung',
      company: 'Unternehmen', address: 'Adresse', city: 'Stadt', country: 'Land',
      status: 'Status', lastContact: 'Letzter Kontakt', notes: 'Notizen',
      details: 'Kontaktdetails',
      deleteTitle: 'Kontakt löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?',
    },
    projects: {
      new: 'Neues Projekt', edit: 'Projekt bearbeiten', name: 'Projektname',
      status: 'Status', progress: 'Fortschritt', members: 'Mitglieder',
      details: 'Projektdetails',
      deleteTitle: 'Projekt löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie dieses Projekt löschen möchten?',
    },
    leads: {
      new: 'Neuer Lead', edit: 'Lead bearbeiten',
      company: 'Unternehmen', contact: 'Kontakt', details: 'Lead-Details',
      deleteTitle: 'Lead löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diesen Lead löschen möchten?',
    },
    notes: {
      new: 'Neue Notiz', content: 'Notizinhalt', type: 'Bezieht sich auf',
      deleteTitle: 'Notiz löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diese Notiz löschen möchten?',
    },
    calendar: {
      newEvent: 'Neues Ereignis', eventType: 'Ereignistyp', location: 'Ort',
      deleteTitle: 'Ereignis löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie dieses Ereignis löschen möchten?',
    },
    dashboard: {
      noActivity: 'Keine aktuellen Aktivitäten.',
      overdueContacts: 'Überfällige Kontakte', noOverdue: 'Keine überfälligen Kontakte.',
      overdue: 'Überfällig', revenue: 'Umsatz-Pipeline',
      leadConversion: 'Lead-Konvertierung', projectStatus: 'Projektstatus',
    },
    reports: {
      generate: 'Bericht erstellen', download: 'Herunterladen',
      selectReport: 'Berichtstyp auswählen',
      startDate: 'Startdatum', endDate: 'Enddatum',
      filters: 'Filter', data: 'Berichtsdaten',
    },
    settings: {
      system: 'Systemeinstellungen', smtp: 'E-Mail (SMTP)',
      smtpPassword: 'SMTP-Passwort', smtpFromName: 'Absendername',
      smtpSaved: 'E-Mail-Einstellungen gespeichert.',
      testSmtp: 'Verbindung testen',
      smtpTestSuccess: 'SMTP-Verbindung erfolgreich.',
      smtpTestFailed: 'SMTP-Verbindung fehlgeschlagen.',
      reminders: 'Erinnerungen',
      overdueContactDays: 'Tage vor Erinnerung für überfällige Kontakte',
      emailReminderDays: 'Tage vor E-Mail-Erinnerung für Ereignisse',
    },
    users: {
      new: 'Neuer Benutzer', edit: 'Benutzer bearbeiten', name: 'Name',
      firstName: 'Vorname', lastName: 'Nachname',
      email: 'E-Mail', password: 'Passwort', newPassword: 'Neues Passwort',
      role: 'Rolle', status: 'Status', active: 'Aktiv', inactive: 'Inaktiv',
      deleteTitle: 'Benutzer löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?',
    },
    roles: {
      title: 'Rollen', new: 'Neue Rolle', edit: 'Rolle bearbeiten',
      name: 'Rollenname', description: 'Beschreibung', permissions: 'Berechtigungen',
      deleteTitle: 'Rolle löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diese Rolle löschen möchten?',
    },
    groups: {
      title: 'Gruppen', new: 'Neue Gruppe', edit: 'Gruppe bearbeiten',
      name: 'Gruppenname', description: 'Beschreibung', members: 'Mitglieder',
      deleteTitle: 'Gruppe löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diese Gruppe löschen möchten?',
    },
    profile: {
      title: 'Profil', personalInfo: 'Persönliche Daten',
      changePassword: 'Passwort ändern', currentPassword: 'Aktuelles Passwort',
      newPassword: 'Neues Passwort', confirmPassword: 'Neues Passwort bestätigen',
      passwordChanged: 'Passwort erfolgreich geändert.', saved: 'Profil gespeichert.',
    },
    translations: {
      title: 'Übersetzungen', new: 'Neue Übersetzung', edit: 'Übersetzung bearbeiten',
      key: 'Schlüssel', value: 'Wert', language: 'Sprache', module: 'Modul',
      searchKeys: 'Schlüssel suchen…',
      deleteTitle: 'Übersetzung löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diese Übersetzung löschen möchten?',
    },
  },

  cs: {
    nav: {
      dashboard: 'Přehled', companies: 'Společnosti', contacts: 'Kontakty',
      projects: 'Projekty', leads: 'Leady', notes: 'Poznámky',
      calendar: 'Kalendář', reports: 'Přehledy', settings: 'Nastavení',
      users: 'Uživatelé', admin: 'Administrace', profile: 'Profil', help: 'Nápověda',
    },
    common: {
      view: 'Zobrazit', notes: 'Poznámky', relatedTo: 'Vztahuje se k',
      confirmMessage: 'Opravdu? Tuto akci nelze vrátit zpět.',
      noData: 'Žádná data k dispozici.', noNotes: 'Zatím žádné poznámky.', empty: 'Prázdné',
    },
    errors: {
      fetchFailed: 'Nepodařilo se načíst data.',
      saveFailed: 'Nepodařilo se uložit.',
      deleteFailed: 'Nepodařilo se smazat.',
      notFound: 'Nenalezeno.', forbidden: 'Přístup odepřen.',
      required: 'Toto pole je povinné.',
    },
    companies: {
      new: 'Nová společnost', edit: 'Upravit společnost', name: 'Název společnosti',
      email: 'E-mail', city: 'Město', country: 'Země', postalCode: 'PSČ',
      vatNumber: 'DIČ', details: 'Detail společnosti',
      deleteTitle: 'Smazat společnost',
      deleteMessage: 'Opravdu chcete tuto společnost smazat?',
    },
    contacts: {
      new: 'Nový kontakt', edit: 'Upravit kontakt', name: 'Jméno',
      email: 'E-mail', phone: 'Telefon', jobTitle: 'Pracovní pozice',
      company: 'Společnost', address: 'Adresa', city: 'Město', country: 'Země',
      status: 'Stav', lastContact: 'Poslední kontakt', notes: 'Poznámky',
      details: 'Detail kontaktu',
      deleteTitle: 'Smazat kontakt',
      deleteMessage: 'Opravdu chcete tento kontakt smazat?',
    },
    projects: {
      new: 'Nový projekt', edit: 'Upravit projekt', name: 'Název projektu',
      status: 'Stav', progress: 'Průběh', members: 'Členové',
      details: 'Detail projektu',
      deleteTitle: 'Smazat projekt',
      deleteMessage: 'Opravdu chcete tento projekt smazat?',
    },
    leads: {
      new: 'Nový lead', edit: 'Upravit lead',
      company: 'Společnost', contact: 'Kontakt', details: 'Detail leadu',
      deleteTitle: 'Smazat lead',
      deleteMessage: 'Opravdu chcete tento lead smazat?',
    },
    notes: {
      new: 'Nová poznámka', content: 'Obsah poznámky', type: 'Vztahuje se k',
      deleteTitle: 'Smazat poznámku',
      deleteMessage: 'Opravdu chcete tuto poznámku smazat?',
    },
    calendar: {
      newEvent: 'Nová událost', eventType: 'Typ události', location: 'Místo',
      deleteTitle: 'Smazat událost',
      deleteMessage: 'Opravdu chcete tuto událost smazat?',
    },
    dashboard: {
      noActivity: 'Žádná nedávná aktivita.',
      overdueContacts: 'Prošlé kontakty', noOverdue: 'Žádné prošlé kontakty.',
      overdue: 'Prošlé', revenue: 'Pipeline příjmů',
      leadConversion: 'Konverze leadů', projectStatus: 'Stav projektů',
    },
    reports: {
      generate: 'Vygenerovat přehled', download: 'Stáhnout',
      selectReport: 'Vyberte typ přehledu',
      startDate: 'Datum zahájení', endDate: 'Datum ukončení',
      filters: 'Filtry', data: 'Data přehledu',
    },
    settings: {
      system: 'Systémová nastavení', smtp: 'E-mail (SMTP)',
      smtpPassword: 'SMTP heslo', smtpFromName: 'Jméno odesílatele',
      smtpSaved: 'Nastavení e-mailu uloženo.',
      testSmtp: 'Otestovat připojení',
      smtpTestSuccess: 'SMTP připojení úspěšné.',
      smtpTestFailed: 'SMTP připojení selhalo.',
      reminders: 'Připomínky',
      overdueContactDays: 'Dny před upozorněním na prošlý kontakt',
      emailReminderDays: 'Dny před e-mailovým upozorněním na událost',
    },
    users: {
      new: 'Nový uživatel', edit: 'Upravit uživatele', name: 'Jméno',
      firstName: 'Jméno', lastName: 'Příjmení',
      email: 'E-mail', password: 'Heslo', newPassword: 'Nové heslo',
      role: 'Role', status: 'Stav', active: 'Aktivní', inactive: 'Neaktivní',
      deleteTitle: 'Smazat uživatele',
      deleteMessage: 'Opravdu chcete tohoto uživatele smazat?',
    },
    roles: {
      title: 'Role', new: 'Nová role', edit: 'Upravit roli',
      name: 'Název role', description: 'Popis', permissions: 'Oprávnění',
      deleteTitle: 'Smazat roli',
      deleteMessage: 'Opravdu chcete tuto roli smazat?',
    },
    groups: {
      title: 'Skupiny', new: 'Nová skupina', edit: 'Upravit skupinu',
      name: 'Název skupiny', description: 'Popis', members: 'Členové',
      deleteTitle: 'Smazat skupinu',
      deleteMessage: 'Opravdu chcete tuto skupinu smazat?',
    },
    profile: {
      title: 'Profil', personalInfo: 'Osobní údaje',
      changePassword: 'Změnit heslo', currentPassword: 'Současné heslo',
      newPassword: 'Nové heslo', confirmPassword: 'Potvrdit nové heslo',
      passwordChanged: 'Heslo úspěšně změněno.', saved: 'Profil uložen.',
    },
    translations: {
      title: 'Překlady', new: 'Nový překlad', edit: 'Upravit překlad',
      key: 'Klíč', value: 'Hodnota', language: 'Jazyk', module: 'Modul',
      searchKeys: 'Hledat klíče…',
      deleteTitle: 'Smazat překlad',
      deleteMessage: 'Opravdu chcete tento překlad smazat?',
    },
  },
};

exports.up = async function (knex) {
  // 1. Rename navigation.* → nav.* for all languages
  await knex('translations')
    .where({ module: 'navigation' })
    .update({
      module: 'nav',
      key: knex.raw("'nav.' || SUBSTRING(key FROM 12)"),
    });

  // 2. Insert all missing translation rows
  for (const [langCode, modules] of Object.entries(MISSING)) {
    for (const [moduleName, keys] of Object.entries(modules)) {
      for (const [key, value] of Object.entries(keys)) {
        const fullKey = `${moduleName}.${key}`;
        await knex('translations')
          .insert({
            id: uuidv4(),
            language_code: langCode,
            key: fullKey,
            value,
            module: moduleName,
          })
          .onConflict(['language_code', 'key'])
          .ignore();
      }
    }
  }
};

exports.down = async function (knex) {
  // Rename nav.* back to navigation.*
  await knex('translations')
    .where({ module: 'nav' })
    .update({
      module: 'navigation',
      key: knex.raw("'navigation.' || SUBSTRING(key FROM 5)"),
    });

  // Remove the newly added modules entirely (can't reliably distinguish
  // pre-existing rows so only drop modules that didn't exist before)
  await knex('translations')
    .whereIn('module', ['errors', 'groups', 'profile', 'roles', 'translations'])
    .delete();
};
