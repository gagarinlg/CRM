'use strict';

exports.up = async (knex) => {
  const translations = [
    // EN
    { language_code: 'en', module: 'files', key: 'files.title', value: 'Files' },
    { language_code: 'en', module: 'files', key: 'files.upload', value: 'Upload File' },
    { language_code: 'en', module: 'files', key: 'files.download', value: 'Download' },
    { language_code: 'en', module: 'files', key: 'files.noFiles', value: 'No files attached yet.' },
    { language_code: 'en', module: 'files', key: 'files.deleteTitle', value: 'Delete File' },
    { language_code: 'en', module: 'files', key: 'files.deleteMessage', value: 'Are you sure you want to delete this file? This cannot be undone.' },
    // DE
    { language_code: 'de', module: 'files', key: 'files.title', value: 'Dateien' },
    { language_code: 'de', module: 'files', key: 'files.upload', value: 'Datei hochladen' },
    { language_code: 'de', module: 'files', key: 'files.download', value: 'Herunterladen' },
    { language_code: 'de', module: 'files', key: 'files.noFiles', value: 'Noch keine Dateien angehängt.' },
    { language_code: 'de', module: 'files', key: 'files.deleteTitle', value: 'Datei löschen' },
    { language_code: 'de', module: 'files', key: 'files.deleteMessage', value: 'Sind Sie sicher, dass Sie diese Datei löschen möchten? Dies kann nicht rückgängig gemacht werden.' },
    // CS
    { language_code: 'cs', module: 'files', key: 'files.title', value: 'Soubory' },
    { language_code: 'cs', module: 'files', key: 'files.upload', value: 'Nahrát soubor' },
    { language_code: 'cs', module: 'files', key: 'files.download', value: 'Stáhnout' },
    { language_code: 'cs', module: 'files', key: 'files.noFiles', value: 'Zatím nejsou přiloženy žádné soubory.' },
    { language_code: 'cs', module: 'files', key: 'files.deleteTitle', value: 'Smazat soubor' },
    { language_code: 'cs', module: 'files', key: 'files.deleteMessage', value: 'Opravdu chcete tento soubor smazat? Tuto akci nelze vrátit.' },
  ];
  for (const row of translations) {
    await knex('translations')
      .insert(row)
      .onConflict(['language_code', 'key'])
      .ignore();
  }
};

exports.down = async (knex) => {
  await knex('translations').where({ module: 'files' }).delete();
};
