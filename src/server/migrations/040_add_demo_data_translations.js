'use strict';

const KEYS = [
  { key: 'settings.demoData',            module: 'settings', en: 'Demo Data',             de: 'Demodaten',            cs: 'Ukázková data' },
  { key: 'settings.demoDataDescription', module: 'settings', en: 'Load a set of example companies, contacts, projects, leads, notes, tags, and calendar events to explore all CRM features.', de: 'Laden Sie eine Reihe von Beispielunternehmen, Kontakten, Projekten, Leads, Notizen, Tags und Kalenderereignissen, um alle CRM-Funktionen zu erkunden.', cs: 'Načtěte sadu ukázkových firem, kontaktů, projektů, potenciálních zákazníků, poznámek, štítků a událostí kalendáře pro prozkoumání všech funkcí CRM.' },
  { key: 'settings.demoDataWarning',     module: 'settings', en: 'This will insert demo records into the live database. It is safe to run multiple times — if demo data is already present it will not be duplicated.', de: 'Dadurch werden Demodatensätze in die Live-Datenbank eingefügt. Es ist sicher, dies mehrmals auszuführen — wenn Demodaten bereits vorhanden sind, werden sie nicht dupliziert.', cs: 'Tím se do živé databáze vloží ukázkové záznamy. Lze bezpečně spustit vícekrát — pokud jsou ukázková data již přítomna, nebudou zduplikována.' },
  { key: 'settings.demoDataLoad',        module: 'settings', en: 'Load Demo Data',         de: 'Demodaten laden',      cs: 'Načíst ukázková data' },
  { key: 'settings.demoDataSuccess',     module: 'settings', en: 'Demo data loaded successfully.', de: 'Demodaten erfolgreich geladen.', cs: 'Ukázková data byla úspěšně načtena.' },
  { key: 'settings.demoDataAlready',     module: 'settings', en: 'Demo data is already loaded.', de: 'Demodaten sind bereits geladen.', cs: 'Ukázková data jsou již načtena.' },
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
