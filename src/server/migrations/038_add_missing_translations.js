'use strict';

const KEYS = [
  // auth module
  { key: 'auth.emailOrUsername',     module: 'auth', en: 'Email or username',          de: 'E-Mail oder Benutzername',              cs: 'E-mail nebo uživatelské jméno' },
  { key: 'auth.signInTitle',         module: 'auth', en: 'Sign in to your account',    de: 'Bei Ihrem Konto anmelden',              cs: 'Přihlásit se k vašemu účtu' },
  { key: 'auth.totpTitle',           module: 'auth', en: 'Two-factor authentication',  de: 'Zwei-Faktor-Authentifizierung',         cs: 'Dvoufaktorové ověření' },
  { key: 'auth.totpCode',            module: 'auth', en: 'Authentication code',        de: 'Authentifizierungscode',                cs: 'Ověřovací kód' },
  { key: 'auth.totpCodeHint',        module: 'auth', en: 'Enter the 6-digit code from your authenticator app, or one of your backup codes.', de: 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App oder einen Ihrer Sicherungscodes ein.', cs: 'Zadejte 6místný kód z vaší ověřovací aplikace nebo jeden ze záložních kódů.' },
  { key: 'auth.verify',              module: 'auth', en: 'Verify',                     de: 'Bestätigen',                            cs: 'Ověřit' },
  { key: 'auth.backToLogin',         module: 'auth', en: '← Back to login',            de: '← Zurück zur Anmeldung',                cs: '← Zpět na přihlášení' },
  { key: 'auth.loginFailed',         module: 'auth', en: 'Login failed. Please check your credentials.', de: 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.', cs: 'Přihlášení selhalo. Zkontrolujte prosím své přihlašovací údaje.' },
  { key: 'auth.totpInvalid',         module: 'auth', en: 'Invalid authentication code. Please try again.', de: 'Ungültiger Authentifizierungscode. Bitte erneut versuchen.', cs: 'Neplatný ověřovací kód. Zkuste to prosím znovu.' },
  { key: 'auth.mustChangePassword',  module: 'auth', en: 'You must change your password before continuing.', de: 'Sie müssen Ihr Passwort ändern, bevor Sie fortfahren können.', cs: 'Před pokračováním musíte změnit heslo.' },
  { key: 'auth.passwordChangeFailed',module: 'auth', en: 'Failed to change password.', de: 'Passwort konnte nicht geändert werden.', cs: 'Změna hesla se nezdařila.' },
  { key: 'auth.minPassword',         module: 'auth', en: 'Minimum 8 characters',       de: 'Mindestens 8 Zeichen',                  cs: 'Minimálně 8 znaků' },
  { key: 'auth.passwordsMustMatch',  module: 'auth', en: 'Passwords must match',       de: 'Passwörter müssen übereinstimmen',      cs: 'Hesla se musí shodovat' },
  { key: 'auth.totpSetupFailed',     module: 'auth', en: 'Failed to start 2FA setup.', de: '2FA-Einrichtung konnte nicht gestartet werden.', cs: 'Nepodařilo se zahájit nastavení dvoufaktorového ověření.' },
  { key: 'auth.totpDisableFailed',   module: 'auth', en: 'Failed to disable 2FA.',     de: '2FA konnte nicht deaktiviert werden.', cs: 'Nepodařilo se deaktivovat dvoufaktorové ověření.' },

  // profile module — 2FA strings
  { key: 'profile.twoFactor',              module: 'profile', en: 'Two-Factor Authentication (2FA)',  de: 'Zwei-Faktor-Authentifizierung (2FA)', cs: 'Dvoufaktorové ověření (2FA)' },
  { key: 'profile.twoFactorEnabled',       module: 'profile', en: '2FA enabled',                      de: '2FA aktiviert',                       cs: '2FA povoleno' },
  { key: 'profile.twoFactorDisabled',      module: 'profile', en: '2FA disabled',                     de: '2FA deaktiviert',                     cs: '2FA zakázáno' },
  { key: 'profile.twoFactorIsEnabled',     module: 'profile', en: 'Two-factor authentication is currently enabled on your account.', de: 'Die Zwei-Faktor-Authentifizierung ist derzeit auf Ihrem Konto aktiviert.', cs: 'Dvoufaktorové ověření je aktuálně povoleno na vašem účtu.' },
  { key: 'profile.twoFactorSetupHint',     module: 'profile', en: 'Add an extra layer of security. You will need an authenticator app such as Google Authenticator, Authy, or any TOTP-compatible app.', de: 'Fügen Sie eine zusätzliche Sicherheitsebene hinzu. Sie benötigen eine Authenticator-App wie Google Authenticator, Authy oder eine andere TOTP-kompatible App.', cs: 'Přidejte další vrstvu zabezpečení. Budete potřebovat ověřovací aplikaci jako Google Authenticator, Authy nebo jakoukoli aplikaci kompatibilní s TOTP.' },
  { key: 'profile.setUp2fa',               module: 'profile', en: 'Set up 2FA',                       de: '2FA einrichten',                      cs: 'Nastavit 2FA' },
  { key: 'profile.twoFactorScanHint',      module: 'profile', en: 'Scan the QR code below with your authenticator app. If you cannot scan it, enter the secret key manually.', de: 'Scannen Sie den QR-Code unten mit Ihrer Authenticator-App. Falls Sie ihn nicht scannen können, geben Sie den geheimen Schlüssel manuell ein.', cs: 'Naskenujte QR kód níže svou ověřovací aplikací. Pokud ho nemůžete naskenovat, zadejte tajný klíč ručně.' },
  { key: 'profile.twoFactorSecretKey',     module: 'profile', en: 'Manual entry secret key:',         de: 'Manuell einzugebender geheimer Schlüssel:', cs: 'Klíč pro ruční zadání:' },
  { key: 'profile.twoFactorConfirmHint',   module: 'profile', en: 'After scanning, enter the 6-digit code from your app to confirm:', de: 'Geben Sie nach dem Scannen den 6-stelligen Code aus Ihrer App zur Bestätigung ein:', cs: 'Po naskenování zadejte 6místný kód z vaší aplikace pro potvrzení:' },
  { key: 'profile.twoFactorCodeLabel',     module: 'profile', en: '6-digit code',                     de: '6-stelliger Code',                    cs: '6místný kód' },
  { key: 'profile.twoFactorConfirmButton', module: 'profile', en: 'Confirm & Enable',                 de: 'Bestätigen & Aktivieren',             cs: 'Potvrdit a aktivovat' },
  { key: 'profile.twoFactorEnabledSuccess',module: 'profile', en: '2FA is now enabled on your account.', de: '2FA ist jetzt auf Ihrem Konto aktiviert.', cs: '2FA je nyní povoleno na vašem účtu.' },
  { key: 'profile.twoFactorBackupWarning', module: 'profile', en: 'Save your backup codes now. They will not be shown again. Each code can be used once if you lose access to your authenticator app.', de: 'Speichern Sie jetzt Ihre Sicherungscodes. Sie werden nicht erneut angezeigt. Jeder Code kann einmal verwendet werden, wenn Sie den Zugang zu Ihrer Authenticator-App verlieren.', cs: 'Uložte si záložní kódy nyní. Nebudou znovu zobrazeny. Každý kód lze použít jednou, pokud ztratíte přístup k ověřovací aplikaci.' },
  { key: 'profile.done',                   module: 'profile', en: 'Done',                             de: 'Fertig',                              cs: 'Hotovo' },
  { key: 'profile.disable2fa',             module: 'profile', en: 'Disable 2FA',                      de: '2FA deaktivieren',                    cs: 'Deaktivovat 2FA' },
  { key: 'profile.disable2faHint',         module: 'profile', en: 'Enter your current password to disable two-factor authentication:', de: 'Geben Sie Ihr aktuelles Passwort ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren:', cs: 'Zadejte aktuální heslo pro deaktivaci dvoufaktorového ověření:' },

  // projects module
  { key: 'projects.statusPlanning',  module: 'projects', en: 'Planning',    de: 'Planung',       cs: 'Plánování' },
  { key: 'projects.statusActive',    module: 'projects', en: 'Active',      de: 'Aktiv',         cs: 'Aktivní' },
  { key: 'projects.statusOnHold',    module: 'projects', en: 'On Hold',     de: 'Pausiert',      cs: 'Pozastaveno' },
  { key: 'projects.statusCompleted', module: 'projects', en: 'Completed',   de: 'Abgeschlossen', cs: 'Dokončeno' },
  { key: 'projects.statusCancelled', module: 'projects', en: 'Cancelled',   de: 'Abgebrochen',   cs: 'Zrušeno' },
  { key: 'projects.addContact',      module: 'projects', en: 'Add Contact', de: 'Kontakt hinzufügen', cs: 'Přidat kontakt' },
  { key: 'projects.addMember',       module: 'projects', en: 'Add Member',  de: 'Mitglied hinzufügen', cs: 'Přidat člena' },
  { key: 'projects.removeContact',   module: 'projects', en: 'Remove',      de: 'Entfernen',     cs: 'Odebrat' },
  { key: 'projects.removeMember',    module: 'projects', en: 'Remove',      de: 'Entfernen',     cs: 'Odebrat' },

  // leads module
  { key: 'leads.stageNew',         module: 'leads', en: 'New',         de: 'Neu',          cs: 'Nový' },
  { key: 'leads.stageContacted',   module: 'leads', en: 'Contacted',   de: 'Kontaktiert',  cs: 'Kontaktován' },
  { key: 'leads.stageQualified',   module: 'leads', en: 'Qualified',   de: 'Qualifiziert', cs: 'Kvalifikovaný' },
  { key: 'leads.stageProposal',    module: 'leads', en: 'Proposal',    de: 'Angebot',      cs: 'Nabídka' },
  { key: 'leads.stageNegotiation', module: 'leads', en: 'Negotiation', de: 'Verhandlung',  cs: 'Vyjednávání' },
  { key: 'leads.stageWon',         module: 'leads', en: 'Won',         de: 'Gewonnen',     cs: 'Vyhráno' },
  { key: 'leads.stageLost',        module: 'leads', en: 'Lost',        de: 'Verloren',     cs: 'Prohráno' },
  { key: 'leads.members',          module: 'leads', en: 'Members',     de: 'Mitglieder',   cs: 'Členové' },
  { key: 'leads.addContact',       module: 'leads', en: 'Add Contact', de: 'Kontakt hinzufügen', cs: 'Přidat kontakt' },
  { key: 'leads.addMember',        module: 'leads', en: 'Add Member',  de: 'Mitglied hinzufügen', cs: 'Přidat člena' },
  { key: 'leads.removeContact',    module: 'leads', en: 'Remove',      de: 'Entfernen',    cs: 'Odebrat' },
  { key: 'leads.removeMember',     module: 'leads', en: 'Remove',      de: 'Entfernen',    cs: 'Odebrat' },

  // calendar module
  { key: 'calendar.typeMeeting',  module: 'calendar', en: 'Meeting',  de: 'Besprechung', cs: 'Schůzka' },
  { key: 'calendar.typeCall',     module: 'calendar', en: 'Call',     de: 'Anruf',       cs: 'Telefonát' },
  { key: 'calendar.typeTask',     module: 'calendar', en: 'Task',     de: 'Aufgabe',     cs: 'Úkol' },
  { key: 'calendar.typeReminder', module: 'calendar', en: 'Reminder', de: 'Erinnerung',  cs: 'Připomínka' },
  { key: 'calendar.typeOther',    module: 'calendar', en: 'Other',    de: 'Sonstiges',   cs: 'Ostatní' },

  // contacts module
  { key: 'contacts.phone',       module: 'contacts', en: 'Phone number', de: 'Telefonnummer',     cs: 'Telefonní číslo' },
  { key: 'contacts.removePhone', module: 'contacts', en: 'Remove phone', de: 'Telefon entfernen', cs: 'Odebrat telefon' },

  // common module
  { key: 'common.listView',    module: 'common', en: 'List',        de: 'Liste',        cs: 'Seznam' },
  { key: 'common.kanbanView',  module: 'common', en: 'Kanban',      de: 'Kanban',       cs: 'Kanban' },
  { key: 'common.searchDots',  module: 'common', en: 'Search…',     de: 'Suchen…',      cs: 'Hledat…' },
  { key: 'common.description', module: 'common', en: 'Description', de: 'Beschreibung', cs: 'Popis' },
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
