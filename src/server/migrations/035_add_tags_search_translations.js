'use strict';

const KEYS = [
  // Tags module
  { module: 'tags', key: 'tags.title',          en: 'Tags',                         de: 'Tags',                              cs: 'Štítky' },
  { module: 'tags', key: 'tags.none',            en: 'No tags',                      de: 'Keine Tags',                        cs: 'Žádné štítky' },
  { module: 'tags', key: 'tags.addTag',          en: 'Add tag',                      de: 'Tag hinzufügen',                    cs: 'Přidat štítek' },
  { module: 'tags', key: 'tags.selectExisting',  en: 'Select existing tag',          de: 'Vorhandenen Tag auswählen',         cs: 'Vybrat existující štítek' },
  { module: 'tags', key: 'tags.searchTags',      en: 'Search tags…',                 de: 'Tags suchen…',                      cs: 'Hledat štítky…' },
  { module: 'tags', key: 'tags.addSelected',     en: 'Add selected tag',             de: 'Ausgewählten Tag hinzufügen',       cs: 'Přidat vybraný štítek' },
  { module: 'tags', key: 'tags.createNew',       en: 'Create new tag',               de: 'Neuen Tag erstellen',               cs: 'Vytvořit nový štítek' },
  { module: 'tags', key: 'tags.name',            en: 'Tag name',                     de: 'Tag-Name',                          cs: 'Název štítku' },
  { module: 'tags', key: 'tags.color',           en: 'Tag color',                    de: 'Tag-Farbe',                         cs: 'Barva štítku' },
  { module: 'tags', key: 'tags.create',          en: 'Create & add',                 de: 'Erstellen & hinzufügen',            cs: 'Vytvořit a přidat' },
  // Search module
  { module: 'search', key: 'search.globalSearch', en: 'Search',                      de: 'Suchen',                            cs: 'Hledat' },
  { module: 'search', key: 'search.placeholder',  en: 'Search projects, leads, contacts, companies…', de: 'Projekte, Leads, Kontakte, Firmen suchen…', cs: 'Hledat projekty, leady, kontakty, firmy…' },
  { module: 'search', key: 'search.hint',         en: 'Type at least 2 characters to search across the CRM.', de: 'Mindestens 2 Zeichen eingeben, um im CRM zu suchen.', cs: 'Zadejte alespoň 2 znaky pro vyhledávání v CRM.' },
  { module: 'search', key: 'search.minChars',     en: 'Please enter at least 2 characters.', de: 'Bitte mindestens 2 Zeichen eingeben.', cs: 'Zadejte prosím alespoň 2 znaky.' },
  { module: 'search', key: 'search.noResults',    en: 'No results found for',         de: 'Keine Ergebnisse gefunden für',     cs: 'Žádné výsledky pro' },
  // Missing nav key
  { module: 'nav', key: 'nav.translations',      en: 'Translations',                 de: 'Übersetzungen',                     cs: 'Překlady' },
  // Missing common keys
  { module: 'common', key: 'common.edited',      en: 'edited',                       de: 'bearbeitet',                        cs: 'upraveno' },
  { module: 'common', key: 'common.unknown',     en: 'Unknown',                      de: 'Unbekannt',                         cs: 'Neznámý' },
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
  const keys = KEYS.map(k => k.key);
  await knex('translations').whereIn('key', keys).delete();
};
