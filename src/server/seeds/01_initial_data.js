'use strict';

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
    navigation: {
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
    },
    companies: {
      title: 'Companies', addCompany: 'Add Company', editCompany: 'Edit Company',
      deleteCompany: 'Delete Company', companyName: 'Company Name',
      industry: 'Industry', size: 'Size', website: 'Website', phone: 'Phone',
      address: 'Address', noCompanies: 'No companies found.',
      companyDetails: 'Company Details', associatedContacts: 'Associated Contacts',
      associatedProjects: 'Associated Projects',
    },
    contacts: {
      title: 'Contacts', addContact: 'Add Contact', editContact: 'Edit Contact',
      deleteContact: 'Delete Contact', firstName: 'First Name', lastName: 'Last Name',
      position: 'Position', lastContactDate: 'Last Contact Date',
      noContacts: 'No contacts found.', contactDetails: 'Contact Details',
      associatedCompany: 'Associated Company',
    },
    projects: {
      title: 'Projects', addProject: 'Add Project', editProject: 'Edit Project',
      deleteProject: 'Delete Project', projectName: 'Project Name',
      startDate: 'Start Date', endDate: 'End Date', budget: 'Budget',
      projectStatus: 'Status', active: 'Active', completed: 'Completed',
      onHold: 'On Hold', cancelled: 'Cancelled', noProjects: 'No projects found.',
      projectDetails: 'Project Details', projectMembers: 'Project Members',
      projectContacts: 'Project Contacts',
    },
    leads: {
      title: 'Leads', addLead: 'Add Lead', editLead: 'Edit Lead',
      deleteLead: 'Delete Lead', leadTitle: 'Lead Title', value: 'Value',
      probability: 'Probability', stage: 'Stage', source: 'Source',
      leadStatus: 'Status', open: 'Open', won: 'Won', lost: 'Lost',
      noLeads: 'No leads found.', leadDetails: 'Lead Details', assignedTo: 'Assigned To',
    },
    notes: {
      title: 'Notes', addNote: 'Add Note', editNote: 'Edit Note',
      deleteNote: 'Delete Note', noteContent: 'Note Content',
      noNotes: 'No notes found.', noteDetails: 'Note Details',
      entityType: 'Related To', entityId: 'Record ID',
    },
    calendar: {
      title: 'Calendar', addEvent: 'Add Event', editEvent: 'Edit Event',
      deleteEvent: 'Delete Event', eventTitle: 'Event Title',
      startDate: 'Start Date', endDate: 'End Date', allDay: 'All Day',
      recurrence: 'Recurrence', noEvents: 'No events found.',
      eventDetails: 'Event Details', reminders: 'Reminders',
    },
    dashboard: {
      title: 'Dashboard', welcome: 'Welcome back!', noWidgets: 'No widgets configured.',
      addWidget: 'Add Widget', editLayout: 'Edit Layout', resetLayout: 'Reset Layout',
      widgetTypes: 'Widget Types', statistics: 'Statistics', recentActivity: 'Recent Activity',
    },
    reports: {
      title: 'Reports', generateReport: 'Generate Report', exportReport: 'Export Report',
      reportType: 'Report Type', dateRange: 'Date Range',
      noReports: 'No reports found.', reportDetails: 'Report Details',
    },
    settings: {
      title: 'Settings', generalSettings: 'General Settings',
      emailSettings: 'Email Settings', securitySettings: 'Security Settings',
      integrationSettings: 'Integration Settings', language: 'Language',
      timezone: 'Timezone', dateFormat: 'Date Format', save: 'Save',
      saved: 'Settings saved.', smtpHost: 'SMTP Host', smtpPort: 'SMTP Port',
      smtpUser: 'SMTP Username', smtpPass: 'SMTP Password', smtpFrom: 'From Address',
    },
    users: {
      title: 'Users', addUser: 'Add User', editUser: 'Edit User',
      deleteUser: 'Delete User', userEmail: 'Email', userRoles: 'Roles',
      userGroups: 'Groups', lastLogin: 'Last Login', noUsers: 'No users found.',
      userDetails: 'User Details', forcePasswordChange: 'Force Password Change',
      resetPassword: 'Reset Password', activateUser: 'Activate User',
      deactivateUser: 'Deactivate User',
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
    navigation: {
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
    },
    companies: {
      title: 'Unternehmen', addCompany: 'Unternehmen hinzufügen',
      editCompany: 'Unternehmen bearbeiten', deleteCompany: 'Unternehmen löschen',
      companyName: 'Unternehmensname', industry: 'Branche', size: 'Größe',
      website: 'Webseite', phone: 'Telefon', address: 'Adresse',
      noCompanies: 'Keine Unternehmen gefunden.',
      companyDetails: 'Unternehmensdetails', associatedContacts: 'Zugehörige Kontakte',
      associatedProjects: 'Zugehörige Projekte',
    },
    contacts: {
      title: 'Kontakte', addContact: 'Kontakt hinzufügen',
      editContact: 'Kontakt bearbeiten', deleteContact: 'Kontakt löschen',
      firstName: 'Vorname', lastName: 'Nachname', position: 'Position',
      lastContactDate: 'Letzter Kontakt', noContacts: 'Keine Kontakte gefunden.',
      contactDetails: 'Kontaktdetails', associatedCompany: 'Zugehöriges Unternehmen',
    },
    projects: {
      title: 'Projekte', addProject: 'Projekt hinzufügen',
      editProject: 'Projekt bearbeiten', deleteProject: 'Projekt löschen',
      projectName: 'Projektname', startDate: 'Startdatum', endDate: 'Enddatum',
      budget: 'Budget', projectStatus: 'Status', active: 'Aktiv',
      completed: 'Abgeschlossen', onHold: 'Pausiert', cancelled: 'Abgebrochen',
      noProjects: 'Keine Projekte gefunden.', projectDetails: 'Projektdetails',
      projectMembers: 'Projektmitglieder', projectContacts: 'Projektkontakte',
    },
    leads: {
      title: 'Leads', addLead: 'Lead hinzufügen', editLead: 'Lead bearbeiten',
      deleteLead: 'Lead löschen', leadTitle: 'Lead-Titel', value: 'Wert',
      probability: 'Wahrscheinlichkeit', stage: 'Phase', source: 'Quelle',
      leadStatus: 'Status', open: 'Offen', won: 'Gewonnen', lost: 'Verloren',
      noLeads: 'Keine Leads gefunden.', leadDetails: 'Lead-Details',
      assignedTo: 'Zugewiesen an',
    },
    notes: {
      title: 'Notizen', addNote: 'Notiz hinzufügen', editNote: 'Notiz bearbeiten',
      deleteNote: 'Notiz löschen', noteContent: 'Notizinhalt',
      noNotes: 'Keine Notizen gefunden.', noteDetails: 'Notizdetails',
      entityType: 'Bezieht sich auf', entityId: 'Datensatz-ID',
    },
    calendar: {
      title: 'Kalender', addEvent: 'Ereignis hinzufügen',
      editEvent: 'Ereignis bearbeiten', deleteEvent: 'Ereignis löschen',
      eventTitle: 'Ereignistitel', startDate: 'Startdatum', endDate: 'Enddatum',
      allDay: 'Ganztägig', recurrence: 'Wiederholung',
      noEvents: 'Keine Ereignisse gefunden.', eventDetails: 'Ereignisdetails',
      reminders: 'Erinnerungen',
    },
    dashboard: {
      title: 'Dashboard', welcome: 'Willkommen zurück!',
      noWidgets: 'Keine Widgets konfiguriert.', addWidget: 'Widget hinzufügen',
      editLayout: 'Layout bearbeiten', resetLayout: 'Layout zurücksetzen',
      widgetTypes: 'Widget-Typen', statistics: 'Statistiken',
      recentActivity: 'Letzte Aktivitäten',
    },
    reports: {
      title: 'Berichte', generateReport: 'Bericht erstellen',
      exportReport: 'Bericht exportieren', reportType: 'Berichtstyp',
      dateRange: 'Zeitraum', noReports: 'Keine Berichte gefunden.',
      reportDetails: 'Berichtsdetails',
    },
    settings: {
      title: 'Einstellungen', generalSettings: 'Allgemeine Einstellungen',
      emailSettings: 'E-Mail-Einstellungen', securitySettings: 'Sicherheitseinstellungen',
      integrationSettings: 'Integrationseinstellungen', language: 'Sprache',
      timezone: 'Zeitzone', dateFormat: 'Datumsformat', save: 'Speichern',
      saved: 'Einstellungen gespeichert.', smtpHost: 'SMTP-Host',
      smtpPort: 'SMTP-Port', smtpUser: 'SMTP-Benutzername',
      smtpPass: 'SMTP-Passwort', smtpFrom: 'Absenderadresse',
    },
    users: {
      title: 'Benutzer', addUser: 'Benutzer hinzufügen',
      editUser: 'Benutzer bearbeiten', deleteUser: 'Benutzer löschen',
      userEmail: 'E-Mail', userRoles: 'Rollen', userGroups: 'Gruppen',
      lastLogin: 'Letzte Anmeldung', noUsers: 'Keine Benutzer gefunden.',
      userDetails: 'Benutzerdetails', forcePasswordChange: 'Passwortänderung erzwingen',
      resetPassword: 'Passwort zurücksetzen', activateUser: 'Benutzer aktivieren',
      deactivateUser: 'Benutzer deaktivieren',
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
    navigation: {
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
    },
    companies: {
      title: 'Společnosti', addCompany: 'Přidat společnost',
      editCompany: 'Upravit společnost', deleteCompany: 'Smazat společnost',
      companyName: 'Název společnosti', industry: 'Odvětví', size: 'Velikost',
      website: 'Webové stránky', phone: 'Telefon', address: 'Adresa',
      noCompanies: 'Žádné společnosti nenalezeny.',
      companyDetails: 'Detail společnosti', associatedContacts: 'Přidružené kontakty',
      associatedProjects: 'Přidružené projekty',
    },
    contacts: {
      title: 'Kontakty', addContact: 'Přidat kontakt',
      editContact: 'Upravit kontakt', deleteContact: 'Smazat kontakt',
      firstName: 'Jméno', lastName: 'Příjmení', position: 'Pozice',
      lastContactDate: 'Poslední kontakt', noContacts: 'Žádné kontakty nenalezeny.',
      contactDetails: 'Detail kontaktu', associatedCompany: 'Přidružená společnost',
    },
    projects: {
      title: 'Projekty', addProject: 'Přidat projekt',
      editProject: 'Upravit projekt', deleteProject: 'Smazat projekt',
      projectName: 'Název projektu', startDate: 'Datum zahájení',
      endDate: 'Datum ukončení', budget: 'Rozpočet', projectStatus: 'Stav',
      active: 'Aktivní', completed: 'Dokončený', onHold: 'Pozastavený',
      cancelled: 'Zrušený', noProjects: 'Žádné projekty nenalezeny.',
      projectDetails: 'Detail projektu', projectMembers: 'Členové projektu',
      projectContacts: 'Kontakty projektu',
    },
    leads: {
      title: 'Leady', addLead: 'Přidat lead', editLead: 'Upravit lead',
      deleteLead: 'Smazat lead', leadTitle: 'Název leadu', value: 'Hodnota',
      probability: 'Pravděpodobnost', stage: 'Fáze', source: 'Zdroj',
      leadStatus: 'Stav', open: 'Otevřený', won: 'Vyhraný', lost: 'Prohraný',
      noLeads: 'Žádné leady nenalezeny.', leadDetails: 'Detail leadu',
      assignedTo: 'Přiřazeno',
    },
    notes: {
      title: 'Poznámky', addNote: 'Přidat poznámku',
      editNote: 'Upravit poznámku', deleteNote: 'Smazat poznámku',
      noteContent: 'Obsah poznámky', noNotes: 'Žádné poznámky nenalezeny.',
      noteDetails: 'Detail poznámky', entityType: 'Vztahuje se k',
      entityId: 'ID záznamu',
    },
    calendar: {
      title: 'Kalendář', addEvent: 'Přidat událost',
      editEvent: 'Upravit událost', deleteEvent: 'Smazat událost',
      eventTitle: 'Název události', startDate: 'Datum zahájení',
      endDate: 'Datum ukončení', allDay: 'Celý den', recurrence: 'Opakování',
      noEvents: 'Žádné události nenalezeny.', eventDetails: 'Detail události',
      reminders: 'Připomínky',
    },
    dashboard: {
      title: 'Přehled', welcome: 'Vítejte zpět!',
      noWidgets: 'Žádné widgety nejsou nakonfigurovány.', addWidget: 'Přidat widget',
      editLayout: 'Upravit rozložení', resetLayout: 'Resetovat rozložení',
      widgetTypes: 'Typy widgetů', statistics: 'Statistiky',
      recentActivity: 'Nedávná aktivita',
    },
    reports: {
      title: 'Přehledy', generateReport: 'Vygenerovat přehled',
      exportReport: 'Exportovat přehled', reportType: 'Typ přehledu',
      dateRange: 'Časové rozmezí', noReports: 'Žádné přehledy nenalezeny.',
      reportDetails: 'Detail přehledu',
    },
    settings: {
      title: 'Nastavení', generalSettings: 'Obecné nastavení',
      emailSettings: 'Nastavení e-mailu', securitySettings: 'Nastavení zabezpečení',
      integrationSettings: 'Nastavení integrací', language: 'Jazyk',
      timezone: 'Časové pásmo', dateFormat: 'Formát data', save: 'Uložit',
      saved: 'Nastavení uloženo.', smtpHost: 'SMTP server',
      smtpPort: 'SMTP port', smtpUser: 'SMTP uživatel',
      smtpPass: 'SMTP heslo', smtpFrom: 'Adresa odesílatele',
    },
    users: {
      title: 'Uživatelé', addUser: 'Přidat uživatele',
      editUser: 'Upravit uživatele', deleteUser: 'Smazat uživatele',
      userEmail: 'E-mail', userRoles: 'Role', userGroups: 'Skupiny',
      lastLogin: 'Poslední přihlášení', noUsers: 'Žádní uživatelé nenalezeni.',
      userDetails: 'Detail uživatele', forcePasswordChange: 'Vynutit změnu hesla',
      resetPassword: 'Obnovit heslo', activateUser: 'Aktivovat uživatele',
      deactivateUser: 'Deaktivovat uživatele',
    },
  },
};

// ─── Main seed function ───────────────────────────────────────────────────────
exports.seed = async function (knex) {
  try {
    // ── Admin user ──────────────────────────────────────────────────────────
    let adminId;
    const existingAdmin = await knex('users').where({ email: 'admin@crm.local' }).first();
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('changeme', 12);
      adminId = uuidv4();
      await knex('users').insert({
        id: adminId,
        email: 'admin@crm.local',
        username: 'admin',
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        force_password_change: true,
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
