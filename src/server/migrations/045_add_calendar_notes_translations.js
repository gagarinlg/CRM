'use strict';

const KEYS = [
  // Calendar — event type labels (used in EventForm dropdowns; currently only exist under notes.*)
  { key: 'calendar.typeMeeting',  module: 'calendar', en: 'Meeting',   de: 'Besprechung', cs: 'Schůzka'   },
  { key: 'calendar.typeCall',     module: 'calendar', en: 'Call',      de: 'Anruf',       cs: 'Telefonát'  },
  { key: 'calendar.typeTask',     module: 'calendar', en: 'Task',      de: 'Aufgabe',     cs: 'Úkol'       },
  { key: 'calendar.typeReminder', module: 'calendar', en: 'Reminder',  de: 'Erinnerung',  cs: 'Připomínka' },
  { key: 'calendar.typeOther',    module: 'calendar', en: 'Other',     de: 'Sonstiges',   cs: 'Ostatní'    },
  // Calendar — toolbar button labels
  { key: 'calendar.today',        module: 'calendar', en: 'Today',     de: 'Heute',       cs: 'Dnes'       },
  { key: 'calendar.month',        module: 'calendar', en: 'Month',     de: 'Monat',       cs: 'Měsíc'      },
  { key: 'calendar.week',         module: 'calendar', en: 'Week',      de: 'Woche',       cs: 'Týden'      },
  { key: 'calendar.day',          module: 'calendar', en: 'Day',       de: 'Tag',         cs: 'Den'        },
  { key: 'calendar.agenda',       module: 'calendar', en: 'Agenda',    de: 'Agenda',      cs: 'Agenda'     },
  // Calendar — week settings
  { key: 'calendar.weekNumbers',      module: 'calendar', en: 'Show week numbers',        de: 'Kalenderwochen anzeigen',      cs: 'Zobrazit čísla týdnů'     },
  { key: 'calendar.weekStart',        module: 'calendar', en: 'First day of week',        de: 'Erster Wochentag',             cs: 'První den týdne'          },
  { key: 'calendar.weekStartSunday',  module: 'calendar', en: 'Sunday',                   de: 'Sonntag',                      cs: 'Neděle'                   },
  { key: 'calendar.weekStartMonday',  module: 'calendar', en: 'Monday',                   de: 'Montag',                       cs: 'Pondělí'                  },
  { key: 'calendar.weekStartSystem',  module: 'calendar', en: 'Use system default',       de: 'Systemstandard verwenden',     cs: 'Použít výchozí systémové' },
  // Profile — calendar preferences section
  { key: 'profile.calendarPreferences', module: 'profile', en: 'Calendar Preferences',   de: 'Kalendereinstellungen',        cs: 'Nastavení kalendáře'      },
  // Settings — system-wide calendar
  { key: 'settings.calendarSettings',     module: 'settings', en: 'Calendar Settings',   de: 'Kalendereinstellungen',        cs: 'Nastavení kalendáře'      },
  { key: 'settings.calendarWeekStart',    module: 'settings', en: 'Default first day of week (system-wide)', de: 'Standard erster Wochentag (systemweit)', cs: 'Výchozí první den týdne (systémový)' },
  { key: 'settings.calendarWeekNumbers',  module: 'settings', en: 'Show week numbers by default', de: 'Kalenderwochen standardmäßig anzeigen', cs: 'Zobrazovat čísla týdnů ve výchozím nastavení' },
  { key: 'settings.calendarSaved',        module: 'settings', en: 'Calendar settings saved.', de: 'Kalendereinstellungen gespeichert.', cs: 'Nastavení kalendáře uloženo.' },
  // Notes — new features
  { key: 'notes.pinNote',            module: 'notes', en: 'Pin note',           de: 'Notiz anheften',      cs: 'Připnout poznámku'    },
  { key: 'notes.unpinNote',          module: 'notes', en: 'Unpin note',         de: 'Notiz lösen',         cs: 'Odepnout poznámku'    },
  { key: 'notes.private',            module: 'notes', en: 'Private note',       de: 'Private Notiz',       cs: 'Soukromá poznámka'    },
  { key: 'notes.privateHint',        module: 'notes', en: 'Only visible to you',de: 'Nur für Sie sichtbar',cs: 'Viditelné pouze vám'  },
  { key: 'notes.filterType',         module: 'notes', en: 'Filter by type',     de: 'Nach Typ filtern',    cs: 'Filtrovat podle typu' },
  { key: 'notes.allTypes',           module: 'notes', en: 'All types',          de: 'Alle Typen',          cs: 'Všechny typy'         },
  { key: 'notes.search',             module: 'notes', en: 'Search notes…',      de: 'Notizen suchen…',     cs: 'Hledat poznámky…'     },
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
