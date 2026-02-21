'use strict';
/* eslint-disable no-console */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ─── Permissions definition ──────────────────────────────────────────────────
const PERMISSIONS = [
  { name: 'contacts.read',     description: 'View contacts',             module: 'contacts' },
  { name: 'contacts.write',    description: 'Create/edit contacts',      module: 'contacts' },
  { name: 'contacts.delete',   description: 'Delete contacts',           module: 'contacts' },
  { name: 'contacts.admin',    description: 'Full contacts admin',        module: 'contacts' },
  { name: 'companies.read',    description: 'View companies',            module: 'companies' },
  { name: 'companies.write',   description: 'Create/edit companies',     module: 'companies' },
  { name: 'companies.delete',  description: 'Delete companies',          module: 'companies' },
  { name: 'companies.admin',   description: 'Full companies admin',       module: 'companies' },
  { name: 'projects.read',     description: 'View projects',             module: 'projects' },
  { name: 'projects.write',    description: 'Create/edit projects',      module: 'projects' },
  { name: 'projects.delete',   description: 'Delete projects',           module: 'projects' },
  { name: 'projects.admin',    description: 'Full projects admin',        module: 'projects' },
  { name: 'leads.read',        description: 'View leads',                module: 'leads' },
  { name: 'leads.write',       description: 'Create/edit leads',         module: 'leads' },
  { name: 'leads.delete',      description: 'Delete leads',              module: 'leads' },
  { name: 'leads.admin',       description: 'Full leads admin',           module: 'leads' },
  { name: 'notes.read',        description: 'View notes',                module: 'notes' },
  { name: 'notes.write',       description: 'Create/edit notes',         module: 'notes' },
  { name: 'notes.delete',      description: 'Delete notes',              module: 'notes' },
  { name: 'calendar.read',     description: 'View calendar events',      module: 'calendar' },
  { name: 'calendar.write',    description: 'Create/edit calendar events', module: 'calendar' },
  { name: 'calendar.delete',   description: 'Delete calendar events',    module: 'calendar' },
  { name: 'reports.read',      description: 'View reports',              module: 'reports' },
  { name: 'reports.generate',  description: 'Generate/export reports',   module: 'reports' },
  { name: 'users.read',        description: 'View users',                module: 'users' },
  { name: 'users.write',       description: 'Create/edit users',         module: 'users' },
  { name: 'users.delete',      description: 'Delete users',              module: 'users' },
  { name: 'users.admin',       description: 'Full users admin',           module: 'users' },
  { name: 'settings.read',     description: 'View settings',             module: 'settings' },
  { name: 'settings.write',    description: 'Edit settings',             module: 'settings' },
];

// ─── Role → permission name mapping ─────────────────────────────────────────
const ROLE_PERMISSIONS = {
  Admin: PERMISSIONS.map((p) => p.name),
  Manager: [
    'contacts.read', 'contacts.write', 'contacts.delete', 'contacts.admin',
    'companies.read', 'companies.write', 'companies.delete', 'companies.admin',
    'projects.read', 'projects.write', 'projects.delete', 'projects.admin',
    'leads.read', 'leads.write', 'leads.delete', 'leads.admin',
    'notes.read', 'notes.write', 'notes.delete',
    'calendar.read', 'calendar.write', 'calendar.delete',
    'reports.read', 'reports.generate',
    'users.read',
    'settings.read',
  ],
  Sales: [
    'contacts.read', 'contacts.write',
    'companies.read', 'companies.write',
    'leads.read', 'leads.write', 'leads.delete',
    'notes.read', 'notes.write',
    'calendar.read', 'calendar.write',
  ],
  User: [
    'contacts.read', 'contacts.write',
    'companies.read',
    'projects.read',
    'leads.read',
    'notes.read', 'notes.write',
    'calendar.read', 'calendar.write',
  ],
  ReadOnly: PERMISSIONS.filter((p) => p.name.endsWith('.read')).map((p) => p.name),
};

// ─── Translations ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    auth: {
      login: 'Login', logout: 'Logout', register: 'Register',
      forgotPassword: 'Forgot Password', resetPassword: 'Reset Password',
      email: 'Email', password: 'Password', username: 'Username',
      rememberMe: 'Remember Me', signIn: 'Sign In', signOut: 'Sign Out',
      invalidCredentials: 'Invalid email or password.',
      sessionExpired: 'Your session has expired. Please log in again.',
      passwordChanged: 'Password changed successfully.',
      passwordResetSent: 'Password reset instructions sent to your email.',
    },
    // Module key is "nav" to match t('nav.*') calls throughout the frontend
    nav: {
      dashboard: 'Dashboard', companies: 'Companies', contacts: 'Contacts',
      projects: 'Projects', leads: 'Leads', notes: 'Notes',
      calendar: 'Calendar', reports: 'Reports', settings: 'Settings',
      users: 'Users', admin: 'Admin', profile: 'Profile', help: 'Help',
    },
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      create: 'Create', search: 'Search', filter: 'Filter', export: 'Export',
      import: 'Import', loading: 'Loading…', noResults: 'No results found.',
      confirm: 'Confirm', yes: 'Yes', no: 'No', back: 'Back', next: 'Next',
      previous: 'Previous', close: 'Close', actions: 'Actions', status: 'Status',
      name: 'Name', description: 'Description', createdAt: 'Created At',
      updatedAt: 'Updated At', active: 'Active', inactive: 'Inactive',
      all: 'All', none: 'None', selectAll: 'Select All', clearAll: 'Clear All',
      required: 'Required', optional: 'Optional', error: 'Error',
      success: 'Success', warning: 'Warning', info: 'Info',
      view: 'View', notes: 'Notes', relatedTo: 'Related To',
      confirmMessage: 'Are you sure? This action cannot be undone.',
      noData: 'No data available.', noNotes: 'No notes yet.', empty: 'Empty',
    },
    errors: {
      fetchFailed: 'Failed to load data.',
      saveFailed: 'Failed to save.',
      deleteFailed: 'Failed to delete.',
      notFound: 'Not found.',
      forbidden: 'Access denied.',
      required: 'This field is required.',
    },
    companies: {
      title: 'Companies', new: 'New Company', edit: 'Edit Company',
      name: 'Company Name', industry: 'Industry', size: 'Size',
      website: 'Website', phone: 'Phone', email: 'Email', address: 'Address',
      city: 'City', country: 'Country', postalCode: 'Postal Code',
      vatNumber: 'VAT Number', details: 'Company Details',
      deleteTitle: 'Delete Company',
      deleteMessage: 'Are you sure you want to delete this company?',
    },
    contacts: {
      title: 'Contacts', new: 'New Contact', edit: 'Edit Contact',
      firstName: 'First Name', lastName: 'Last Name', name: 'Name',
      email: 'Email', phone: 'Phone', jobTitle: 'Job Title',
      company: 'Company', address: 'Address', city: 'City', country: 'Country',
      status: 'Status', lastContact: 'Last Contact', notes: 'Notes',
      details: 'Contact Details',
      deleteTitle: 'Delete Contact',
      deleteMessage: 'Are you sure you want to delete this contact?',
    },
    projects: {
      title: 'Projects', new: 'New Project', edit: 'Edit Project',
      name: 'Project Name', startDate: 'Start Date', endDate: 'End Date',
      budget: 'Budget', status: 'Status', progress: 'Progress',
      members: 'Members', details: 'Project Details',
      company: 'Company',
      visibility: 'Visibility',
      visibilityPublic: 'Public (all users)',
      visibilityRestricted: 'Restricted (selected groups only)',
      groups: 'Access Groups',
      groupsHint: 'Only members of these groups can see this project.',
      deleteTitle: 'Delete Project',
      deleteMessage: 'Are you sure you want to delete this project?',
    },
    leads: {
      title: 'Leads', new: 'New Lead', edit: 'Edit Lead',
      title_field: 'Title',
      value: 'Value', probability: 'Probability', stage: 'Stage',
      source: 'Source', assignedTo: 'Assigned To',
      company: 'Company', contact: 'Contact', details: 'Lead Details',
      deleteTitle: 'Delete Lead',
      deleteMessage: 'Are you sure you want to delete this lead?',
    },
    notes: {
      title: 'Notes', new: 'New Note',
      content: 'Note Content', type: 'Note Type',
      addNote: 'Add Note', editNote: 'Edit Note',
      noNotes: 'No notes yet. Add the first note.',
      typeGeneral: 'General', typeCall: 'Call', typeMeeting: 'Meeting',
      typeEmail: 'Email', typeTask: 'Task',
      deleteTitle: 'Delete Note',
      deleteMessage: 'Are you sure you want to delete this note?',
    },
    calendar: {
      title: 'Calendar', newEvent: 'New Event', editEvent: 'Edit Event',
      eventTitle: 'Event Title', startDate: 'Start Date', endDate: 'End Date',
      eventType: 'Event Type', location: 'Location', allDay: 'All Day',
      recurrence: 'Recurrence', reminders: 'Reminders',
      deleteTitle: 'Delete Event',
      deleteMessage: 'Are you sure you want to delete this event?',
    },
    dashboard: {
      title: 'Dashboard', welcome: 'Welcome back!',
      recentActivity: 'Recent Activity', noActivity: 'No recent activity.',
      overdueContacts: 'Overdue Contacts', noOverdue: 'No overdue contacts.',
      overdue: 'Overdue', revenue: 'Revenue Pipeline',
      leadConversion: 'Lead Conversion', projectStatus: 'Project Status',
    },
    reports: {
      title: 'Reports', generate: 'Generate Report',
      download: 'Download', selectReport: 'Select Report Type',
      startDate: 'Start Date', endDate: 'End Date',
      filters: 'Filters', data: 'Report Data',
      sales: 'Sales Report', leadPipeline: 'Lead Pipeline',
      projectStatus: 'Project Status', contactActivity: 'Contact Activity',
      userActivity: 'User Activity', noData: 'No report data available.',
    },
    settings: {
      title: 'Settings', saved: 'Settings saved.',
      system: 'System Settings', smtp: 'Email (SMTP)',
      smtpHost: 'SMTP Host', smtpPort: 'SMTP Port',
      smtpUser: 'SMTP Username', smtpPassword: 'SMTP Password',
      smtpFrom: 'From Address', smtpFromName: 'From Name',
      smtpSaved: 'Email settings saved.', testSmtp: 'Test Connection',
      smtpTestSuccess: 'SMTP connection successful.',
      smtpTestFailed: 'SMTP connection failed.',
      reminders: 'Reminders', overdueContactDays: 'Days before overdue contact reminder',
      emailReminderDays: 'Days before event email reminder',
    },
    users: {
      title: 'Users', new: 'New User', edit: 'Edit User',
      name: 'Name', firstName: 'First Name', lastName: 'Last Name',
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
      language: 'Interface Language', languageHint: 'This language will be used by default when you log in.',
    },
    translations: {
      title: 'Translations', new: 'New Translation', edit: 'Edit Translation',
      key: 'Key', value: 'Value', language: 'Language', module: 'Module',
      searchKeys: 'Search keys…',
      deleteTitle: 'Delete Translation',
      deleteMessage: 'Are you sure you want to delete this translation?',
      keys: 'Translation Keys', languages: 'Languages',
      newLanguage: 'New Language', editLanguage: 'Edit Language',
      langCode: 'Code', langName: 'Name', default: 'Default',
      deleteLanguageTitle: 'Delete Language',
      deleteLanguageMessage: 'Are you sure you want to delete this language? All its translations will also be deleted.',
    },
  },

  de: {
    auth: {
      login: 'Anmelden', logout: 'Abmelden', register: 'Registrieren',
      forgotPassword: 'Passwort vergessen', resetPassword: 'Passwort zurücksetzen',
      email: 'E-Mail', password: 'Passwort', username: 'Benutzername',
      rememberMe: 'Angemeldet bleiben', signIn: 'Einloggen', signOut: 'Ausloggen',
      invalidCredentials: 'Ungültige E-Mail oder Passwort.',
      sessionExpired: 'Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.',
      passwordChanged: 'Passwort erfolgreich geändert.',
      passwordResetSent: 'Anweisungen zum Zurücksetzen des Passworts wurden gesendet.',
    },
    nav: {
      dashboard: 'Dashboard', companies: 'Unternehmen', contacts: 'Kontakte',
      projects: 'Projekte', leads: 'Leads', notes: 'Notizen',
      calendar: 'Kalender', reports: 'Berichte', settings: 'Einstellungen',
      users: 'Benutzer', admin: 'Administration', profile: 'Profil', help: 'Hilfe',
    },
    common: {
      save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten',
      create: 'Erstellen', search: 'Suchen', filter: 'Filtern', export: 'Exportieren',
      import: 'Importieren', loading: 'Lädt…', noResults: 'Keine Ergebnisse gefunden.',
      confirm: 'Bestätigen', yes: 'Ja', no: 'Nein', back: 'Zurück', next: 'Weiter',
      previous: 'Vorherige', close: 'Schließen', actions: 'Aktionen', status: 'Status',
      name: 'Name', description: 'Beschreibung', createdAt: 'Erstellt am',
      updatedAt: 'Aktualisiert am', active: 'Aktiv', inactive: 'Inaktiv',
      all: 'Alle', none: 'Keine', selectAll: 'Alle auswählen', clearAll: 'Alle löschen',
      required: 'Pflichtfeld', optional: 'Optional', error: 'Fehler',
      success: 'Erfolg', warning: 'Warnung', info: 'Info',
      view: 'Ansehen', notes: 'Notizen', relatedTo: 'Bezieht sich auf',
      confirmMessage: 'Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.',
      noData: 'Keine Daten verfügbar.', noNotes: 'Noch keine Notizen.', empty: 'Leer',
    },
    errors: {
      fetchFailed: 'Daten konnten nicht geladen werden.',
      saveFailed: 'Speichern fehlgeschlagen.',
      deleteFailed: 'Löschen fehlgeschlagen.',
      notFound: 'Nicht gefunden.',
      forbidden: 'Zugriff verweigert.',
      required: 'Dieses Feld ist erforderlich.',
    },
    companies: {
      title: 'Unternehmen', new: 'Neues Unternehmen', edit: 'Unternehmen bearbeiten',
      name: 'Unternehmensname', industry: 'Branche', size: 'Größe',
      website: 'Webseite', phone: 'Telefon', email: 'E-Mail', address: 'Adresse',
      city: 'Stadt', country: 'Land', postalCode: 'Postleitzahl',
      vatNumber: 'Umsatzsteuer-ID', details: 'Unternehmensdetails',
      deleteTitle: 'Unternehmen löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie dieses Unternehmen löschen möchten?',
    },
    contacts: {
      title: 'Kontakte', new: 'Neuer Kontakt', edit: 'Kontakt bearbeiten',
      firstName: 'Vorname', lastName: 'Nachname', name: 'Name',
      email: 'E-Mail', phone: 'Telefon', jobTitle: 'Berufsbezeichnung',
      company: 'Unternehmen', address: 'Adresse', city: 'Stadt', country: 'Land',
      status: 'Status', lastContact: 'Letzter Kontakt', notes: 'Notizen',
      details: 'Kontaktdetails',
      deleteTitle: 'Kontakt löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?',
    },
    projects: {
      title: 'Projekte', new: 'Neues Projekt', edit: 'Projekt bearbeiten',
      name: 'Projektname', startDate: 'Startdatum', endDate: 'Enddatum',
      budget: 'Budget', status: 'Status', progress: 'Fortschritt',
      members: 'Mitglieder', details: 'Projektdetails',
      company: 'Unternehmen',
      visibility: 'Sichtbarkeit',
      visibilityPublic: 'Öffentlich (alle Benutzer)',
      visibilityRestricted: 'Eingeschränkt (nur ausgewählte Gruppen)',
      groups: 'Zugriffsgruppen',
      groupsHint: 'Nur Mitglieder dieser Gruppen können dieses Projekt sehen.',
      deleteTitle: 'Projekt löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie dieses Projekt löschen möchten?',
    },
    leads: {
      title: 'Leads', new: 'Neuer Lead', edit: 'Lead bearbeiten',
      title_field: 'Titel',
      value: 'Wert', probability: 'Wahrscheinlichkeit', stage: 'Phase',
      source: 'Quelle', assignedTo: 'Zugewiesen an',
      company: 'Unternehmen', contact: 'Kontakt', details: 'Lead-Details',
      deleteTitle: 'Lead löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diesen Lead löschen möchten?',
    },
    notes: {
      title: 'Notizen', new: 'Neue Notiz',
      content: 'Notizinhalt', type: 'Notiztyp',
      addNote: 'Notiz hinzufügen', editNote: 'Notiz bearbeiten',
      noNotes: 'Noch keine Notizen. Erste Notiz hinzufügen.',
      typeGeneral: 'Allgemein', typeCall: 'Anruf', typeMeeting: 'Besprechung',
      typeEmail: 'E-Mail', typeTask: 'Aufgabe',
      deleteTitle: 'Notiz löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diese Notiz löschen möchten?',
    },
    calendar: {
      title: 'Kalender', newEvent: 'Neues Ereignis', editEvent: 'Ereignis bearbeiten',
      eventTitle: 'Ereignistitel', startDate: 'Startdatum', endDate: 'Enddatum',
      eventType: 'Ereignistyp', location: 'Ort', allDay: 'Ganztägig',
      recurrence: 'Wiederholung', reminders: 'Erinnerungen',
      deleteTitle: 'Ereignis löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie dieses Ereignis löschen möchten?',
    },
    dashboard: {
      title: 'Dashboard', welcome: 'Willkommen zurück!',
      recentActivity: 'Letzte Aktivitäten', noActivity: 'Keine aktuellen Aktivitäten.',
      overdueContacts: 'Überfällige Kontakte', noOverdue: 'Keine überfälligen Kontakte.',
      overdue: 'Überfällig', revenue: 'Umsatz-Pipeline',
      leadConversion: 'Lead-Konvertierung', projectStatus: 'Projektstatus',
    },
    reports: {
      title: 'Berichte', generate: 'Bericht erstellen',
      download: 'Herunterladen', selectReport: 'Berichtstyp auswählen',
      startDate: 'Startdatum', endDate: 'Enddatum',
      filters: 'Filter', data: 'Berichtsdaten',
      sales: 'Umsatzbericht', leadPipeline: 'Lead-Pipeline',
      projectStatus: 'Projektstatus', contactActivity: 'Kontaktaktivität',
      userActivity: 'Benutzeraktivität', noData: 'Keine Berichtsdaten verfügbar.',
    },
    settings: {
      title: 'Einstellungen', saved: 'Einstellungen gespeichert.',
      system: 'Systemeinstellungen', smtp: 'E-Mail (SMTP)',
      smtpHost: 'SMTP-Host', smtpPort: 'SMTP-Port',
      smtpUser: 'SMTP-Benutzername', smtpPassword: 'SMTP-Passwort',
      smtpFrom: 'Absenderadresse', smtpFromName: 'Absendername',
      smtpSaved: 'E-Mail-Einstellungen gespeichert.', testSmtp: 'Verbindung testen',
      smtpTestSuccess: 'SMTP-Verbindung erfolgreich.',
      smtpTestFailed: 'SMTP-Verbindung fehlgeschlagen.',
      reminders: 'Erinnerungen',
      overdueContactDays: 'Tage vor Erinnerung für überfällige Kontakte',
      emailReminderDays: 'Tage vor E-Mail-Erinnerung für Ereignisse',
    },
    users: {
      title: 'Benutzer', new: 'Neuer Benutzer', edit: 'Benutzer bearbeiten',
      name: 'Name', firstName: 'Vorname', lastName: 'Nachname',
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
      language: 'Oberflächensprache', languageHint: 'Diese Sprache wird nach dem Einloggen automatisch verwendet.',
    },
    translations: {
      title: 'Übersetzungen', new: 'Neue Übersetzung', edit: 'Übersetzung bearbeiten',
      key: 'Schlüssel', value: 'Wert', language: 'Sprache', module: 'Modul',
      searchKeys: 'Schlüssel suchen…',
      deleteTitle: 'Übersetzung löschen',
      deleteMessage: 'Sind Sie sicher, dass Sie diese Übersetzung löschen möchten?',
      keys: 'Übersetzungsschlüssel', languages: 'Sprachen',
      newLanguage: 'Neue Sprache', editLanguage: 'Sprache bearbeiten',
      langCode: 'Code', langName: 'Name', default: 'Standard',
      deleteLanguageTitle: 'Sprache löschen',
      deleteLanguageMessage: 'Sind Sie sicher, dass Sie diese Sprache löschen möchten? Alle zugehörigen Übersetzungen werden ebenfalls gelöscht.',
    },
  },

  cs: {
    auth: {
      login: 'Přihlásit', logout: 'Odhlásit', register: 'Registrovat',
      forgotPassword: 'Zapomenuté heslo', resetPassword: 'Obnovit heslo',
      email: 'E-mail', password: 'Heslo', username: 'Uživatelské jméno',
      rememberMe: 'Zapamatovat si mě', signIn: 'Přihlásit se', signOut: 'Odhlásit se',
      invalidCredentials: 'Neplatný e-mail nebo heslo.',
      sessionExpired: 'Vaše relace vypršela. Přihlaste se prosím znovu.',
      passwordChanged: 'Heslo bylo úspěšně změněno.',
      passwordResetSent: 'Instrukce pro obnovení hesla byly odeslány na váš e-mail.',
    },
    nav: {
      dashboard: 'Přehled', companies: 'Společnosti', contacts: 'Kontakty',
      projects: 'Projekty', leads: 'Leady', notes: 'Poznámky',
      calendar: 'Kalendář', reports: 'Přehledy', settings: 'Nastavení',
      users: 'Uživatelé', admin: 'Administrace', profile: 'Profil', help: 'Nápověda',
    },
    common: {
      save: 'Uložit', cancel: 'Zrušit', delete: 'Smazat', edit: 'Upravit',
      create: 'Vytvořit', search: 'Hledat', filter: 'Filtrovat', export: 'Exportovat',
      import: 'Importovat', loading: 'Načítání…', noResults: 'Žádné výsledky.',
      confirm: 'Potvrdit', yes: 'Ano', no: 'Ne', back: 'Zpět', next: 'Další',
      previous: 'Předchozí', close: 'Zavřít', actions: 'Akce', status: 'Stav',
      name: 'Název', description: 'Popis', createdAt: 'Vytvořeno',
      updatedAt: 'Aktualizováno', active: 'Aktivní', inactive: 'Neaktivní',
      all: 'Vše', none: 'Nic', selectAll: 'Vybrat vše', clearAll: 'Zrušit vše',
      required: 'Povinné', optional: 'Volitelné', error: 'Chyba',
      success: 'Úspěch', warning: 'Varování', info: 'Info',
      view: 'Zobrazit', notes: 'Poznámky', relatedTo: 'Vztahuje se k',
      confirmMessage: 'Opravdu? Tuto akci nelze vrátit zpět.',
      noData: 'Žádná data k dispozici.', noNotes: 'Zatím žádné poznámky.', empty: 'Prázdné',
    },
    errors: {
      fetchFailed: 'Nepodařilo se načíst data.',
      saveFailed: 'Nepodařilo se uložit.',
      deleteFailed: 'Nepodařilo se smazat.',
      notFound: 'Nenalezeno.',
      forbidden: 'Přístup odepřen.',
      required: 'Toto pole je povinné.',
    },
    companies: {
      title: 'Společnosti', new: 'Nová společnost', edit: 'Upravit společnost',
      name: 'Název společnosti', industry: 'Odvětví', size: 'Velikost',
      website: 'Webové stránky', phone: 'Telefon', email: 'E-mail', address: 'Adresa',
      city: 'Město', country: 'Země', postalCode: 'PSČ',
      vatNumber: 'DIČ', details: 'Detail společnosti',
      deleteTitle: 'Smazat společnost',
      deleteMessage: 'Opravdu chcete tuto společnost smazat?',
    },
    contacts: {
      title: 'Kontakty', new: 'Nový kontakt', edit: 'Upravit kontakt',
      firstName: 'Jméno', lastName: 'Příjmení', name: 'Jméno',
      email: 'E-mail', phone: 'Telefon', jobTitle: 'Pracovní pozice',
      company: 'Společnost', address: 'Adresa', city: 'Město', country: 'Země',
      status: 'Stav', lastContact: 'Poslední kontakt', notes: 'Poznámky',
      details: 'Detail kontaktu',
      deleteTitle: 'Smazat kontakt',
      deleteMessage: 'Opravdu chcete tento kontakt smazat?',
    },
    projects: {
      title: 'Projekty', new: 'Nový projekt', edit: 'Upravit projekt',
      name: 'Název projektu', startDate: 'Datum zahájení', endDate: 'Datum ukončení',
      budget: 'Rozpočet', status: 'Stav', progress: 'Průběh',
      members: 'Členové', details: 'Detail projektu',
      company: 'Společnost',
      visibility: 'Viditelnost',
      visibilityPublic: 'Veřejný (všichni uživatelé)',
      visibilityRestricted: 'Omezený (pouze vybrané skupiny)',
      groups: 'Skupiny přístupu',
      groupsHint: 'Tento projekt mohou vidět pouze členové těchto skupin.',
      deleteTitle: 'Smazat projekt',
      deleteMessage: 'Opravdu chcete tento projekt smazat?',
    },
    leads: {
      title: 'Leady', new: 'Nový lead', edit: 'Upravit lead',
      title_field: 'Název',
      value: 'Hodnota', probability: 'Pravděpodobnost', stage: 'Fáze',
      source: 'Zdroj', assignedTo: 'Přiřazeno',
      company: 'Společnost', contact: 'Kontakt', details: 'Detail leadu',
      deleteTitle: 'Smazat lead',
      deleteMessage: 'Opravdu chcete tento lead smazat?',
    },
    notes: {
      title: 'Poznámky', new: 'Nová poznámka',
      content: 'Obsah poznámky', type: 'Typ poznámky',
      addNote: 'Přidat poznámku', editNote: 'Upravit poznámku',
      noNotes: 'Zatím žádné poznámky. Přidejte první poznámku.',
      typeGeneral: 'Obecné', typeCall: 'Telefonát', typeMeeting: 'Schůzka',
      typeEmail: 'E-mail', typeTask: 'Úkol',
      deleteTitle: 'Smazat poznámku',
      deleteMessage: 'Opravdu chcete tuto poznámku smazat?',
    },
    calendar: {
      title: 'Kalendář', newEvent: 'Nová událost', editEvent: 'Upravit událost',
      eventTitle: 'Název události', startDate: 'Datum zahájení', endDate: 'Datum ukončení',
      eventType: 'Typ události', location: 'Místo', allDay: 'Celý den',
      recurrence: 'Opakování', reminders: 'Připomínky',
      deleteTitle: 'Smazat událost',
      deleteMessage: 'Opravdu chcete tuto událost smazat?',
    },
    dashboard: {
      title: 'Přehled', welcome: 'Vítejte zpět!',
      recentActivity: 'Nedávná aktivita', noActivity: 'Žádná nedávná aktivita.',
      overdueContacts: 'Prošlé kontakty', noOverdue: 'Žádné prošlé kontakty.',
      overdue: 'Prošlé', revenue: 'Pipeline příjmů',
      leadConversion: 'Konverze leadů', projectStatus: 'Stav projektů',
    },
    reports: {
      title: 'Přehledy', generate: 'Vygenerovat přehled',
      download: 'Stáhnout', selectReport: 'Vyberte typ přehledu',
      startDate: 'Datum zahájení', endDate: 'Datum ukončení',
      filters: 'Filtry', data: 'Data přehledu',
      sales: 'Zpráva o prodeji', leadPipeline: 'Přehled leadů',
      projectStatus: 'Stav projektů', contactActivity: 'Aktivita kontaktů',
      userActivity: 'Aktivita uživatelů', noData: 'Žádná data zprávy.',
    },
    settings: {
      title: 'Nastavení', saved: 'Nastavení uloženo.',
      system: 'Systémová nastavení', smtp: 'E-mail (SMTP)',
      smtpHost: 'SMTP server', smtpPort: 'SMTP port',
      smtpUser: 'SMTP uživatel', smtpPassword: 'SMTP heslo',
      smtpFrom: 'Adresa odesílatele', smtpFromName: 'Jméno odesílatele',
      smtpSaved: 'Nastavení e-mailu uloženo.', testSmtp: 'Otestovat připojení',
      smtpTestSuccess: 'SMTP připojení úspěšné.',
      smtpTestFailed: 'SMTP připojení selhalo.',
      reminders: 'Připomínky',
      overdueContactDays: 'Dny před upozorněním na prošlý kontakt',
      emailReminderDays: 'Dny před e-mailovým upozorněním na událost',
    },
    users: {
      title: 'Uživatelé', new: 'Nový uživatel', edit: 'Upravit uživatele',
      name: 'Jméno', firstName: 'Jméno', lastName: 'Příjmení',
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
      language: 'Jazyk rozhraní', languageHint: 'Tento jazyk bude použit automaticky po přihlášení.',
    },
    translations: {
      title: 'Překlady', new: 'Nový překlad', edit: 'Upravit překlad',
      key: 'Klíč', value: 'Hodnota', language: 'Jazyk', module: 'Modul',
      searchKeys: 'Hledat klíče…',
      deleteTitle: 'Smazat překlad',
      deleteMessage: 'Opravdu chcete tento překlad smazat?',
      keys: 'Překladové klíče', languages: 'Jazyky',
      newLanguage: 'Nový jazyk', editLanguage: 'Upravit jazyk',
      langCode: 'Kód', langName: 'Název', default: 'Výchozí',
      deleteLanguageTitle: 'Smazat jazyk',
      deleteLanguageMessage: 'Opravdu chcete tento jazyk smazat? Všechny jeho překlady budou také smazány.',
    },
  },
};

// ─── Main seed function ───────────────────────────────────────────────────────
exports.seed = async function (knex) {
  try {
    // ── Admin user ──────────────────────────────────────────────────────────
    // Allow CI/test overrides via environment variables:
    //   SEED_ADMIN_PASSWORD      – plaintext password to hash (default: 'changeme')
    //   SEED_FORCE_PASSWORD_CHANGE – 'false' to skip force-change (default: 'true')
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme';
    const forcePasswordChange = process.env.SEED_FORCE_PASSWORD_CHANGE !== 'false';

    let adminId;
    const existingAdmin = await knex('users').where({ email: 'admin@crm.local' }).first();
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      adminId = uuidv4();
      await knex('users').insert({
        id: adminId,
        email: 'admin@crm.local',
        username: 'admin',
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        force_password_change: forcePasswordChange,
      });
    } else {
      adminId = existingAdmin.id;
    }

    // ── Permissions ─────────────────────────────────────────────────────────
    for (const perm of PERMISSIONS) {
      await knex('permissions')
        .insert({ id: uuidv4(), ...perm })
        .onConflict('name')
        .ignore();
    }

    const dbPerms = await knex('permissions').select('id', 'name');
    const permByName = Object.fromEntries(dbPerms.map((p) => [p.name, p.id]));

    // ── Roles ────────────────────────────────────────────────────────────────
    const roleDefs = [
      { name: 'Admin',    description: 'Full system access',           is_system: true },
      { name: 'Manager',  description: 'Manage CRM data and users',    is_system: true },
      { name: 'Sales',    description: 'Sales team access',            is_system: true },
      { name: 'User',     description: 'Standard user access',         is_system: true },
      { name: 'ReadOnly', description: 'Read-only access to CRM data', is_system: true },
    ];

    for (const roleDef of roleDefs) {
      await knex('roles').insert({ id: uuidv4(), ...roleDef }).onConflict('name').ignore();
    }

    const dbRoles = await knex('roles').select('id', 'name');
    const roleByName = Object.fromEntries(dbRoles.map((r) => [r.name, r.id]));

    // ── Role ↔ Permission assignments ────────────────────────────────────────
    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleByName[roleName];
      if (!roleId) continue;
      for (const permName of permNames) {
        const permId = permByName[permName];
        if (!permId) continue;
        await knex('role_permissions')
          .insert({ role_id: roleId, permission_id: permId })
          .onConflict(['role_id', 'permission_id'])
          .ignore();
      }
    }

    // ── Assign Admin role to admin user ──────────────────────────────────────
    await knex('user_roles')
      .insert({ user_id: adminId, role_id: roleByName['Admin'] })
      .onConflict(['user_id', 'role_id'])
      .ignore();

    // ── Lead stages ──────────────────────────────────────────────────────────
    const leadStages = [
      { name: 'New',         order_index: 1, is_default: true },
      { name: 'Qualified',   order_index: 2, is_default: false },
      { name: 'Proposal',    order_index: 3, is_default: false },
      { name: 'Negotiation', order_index: 4, is_default: false },
      { name: 'Won',         order_index: 5, is_default: false },
      { name: 'Lost',        order_index: 6, is_default: false },
    ];
    for (const stage of leadStages) {
      await knex('lead_stages').insert({ id: uuidv4(), ...stage }).onConflict('name').ignore();
    }

    // ── Languages ────────────────────────────────────────────────────────────
    const languages = [
      { code: 'en', name: 'English',  is_default: true,  is_active: true },
      { code: 'de', name: 'Deutsch',  is_default: false, is_active: true },
      { code: 'cs', name: 'Čeština', is_default: false, is_active: true },
    ];
    for (const lang of languages) {
      await knex('languages').insert({ id: uuidv4(), ...lang }).onConflict('code').ignore();
    }

    // ── Translations ─────────────────────────────────────────────────────────
    for (const [langCode, modules] of Object.entries(TRANSLATIONS)) {
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

    // ── Default SMTP settings ────────────────────────────────────────────────
    const smtpCount = await knex('smtp_settings').count('id as c').first();
    if (parseInt(smtpCount.c, 10) === 0) {
      await knex('smtp_settings').insert({
        id: uuidv4(),
        host: 'smtp.example.com',
        port: 587,
        username: '',
        password_encrypted: '',
        from_address: 'noreply@example.com',
        from_name: 'CRM System',
        is_active: false,
      });
    }

    // ── Default dashboard config for admin ───────────────────────────────────
    await knex('dashboard_configs')
      .insert({
        id: uuidv4(),
        user_id: adminId,
        name: 'Default Dashboard',
        layout: JSON.stringify({}),
        widgets: JSON.stringify([
          'stats_companies',
          'stats_contacts',
          'stats_leads',
          'stats_projects',
          'recent_activity',
          'upcoming_events',
        ]),
      })
      .onConflict('user_id')
      .ignore();

    console.log('✅  Seed completed successfully.');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    throw err;
  }
};
