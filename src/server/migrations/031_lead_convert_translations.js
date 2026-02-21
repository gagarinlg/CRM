'use strict';

exports.up = async function (knex) {
  const keys = [
    // EN
    { language_code: 'en', module: 'leads', key: 'convertToProject', value: 'Convert to Project' },
    { language_code: 'en', module: 'leads', key: 'convertConfirm', value: 'Convert this lead into a project? The lead will be marked as won.' },
    { language_code: 'en', module: 'leads', key: 'convertSuccess', value: 'Lead successfully converted to project.' },
    { language_code: 'en', module: 'leads', key: 'visibility', value: 'Visibility' },
    { language_code: 'en', module: 'leads', key: 'visibilityPublic', value: 'Public (all users)' },
    { language_code: 'en', module: 'leads', key: 'visibilityRestricted', value: 'Restricted (selected groups only)' },
    { language_code: 'en', module: 'leads', key: 'groups', value: 'Access Groups' },
    { language_code: 'en', module: 'leads', key: 'groupsHint', value: 'Only members of the selected groups can see this lead.' },
    { language_code: 'en', module: 'leads', key: 'convertedFrom', value: 'Converted from lead' },
    // DE
    { language_code: 'de', module: 'leads', key: 'convertToProject', value: 'In Projekt umwandeln' },
    { language_code: 'de', module: 'leads', key: 'convertConfirm', value: 'Diesen Lead in ein Projekt umwandeln? Der Lead wird als gewonnen markiert.' },
    { language_code: 'de', module: 'leads', key: 'convertSuccess', value: 'Lead erfolgreich in Projekt umgewandelt.' },
    { language_code: 'de', module: 'leads', key: 'visibility', value: 'Sichtbarkeit' },
    { language_code: 'de', module: 'leads', key: 'visibilityPublic', value: 'Öffentlich (alle Benutzer)' },
    { language_code: 'de', module: 'leads', key: 'visibilityRestricted', value: 'Eingeschränkt (nur ausgewählte Gruppen)' },
    { language_code: 'de', module: 'leads', key: 'groups', value: 'Zugriffsgruppen' },
    { language_code: 'de', module: 'leads', key: 'groupsHint', value: 'Nur Mitglieder der ausgewählten Gruppen können diesen Lead sehen.' },
    { language_code: 'de', module: 'leads', key: 'convertedFrom', value: 'Aus Lead konvertiert' },
    // CS
    { language_code: 'cs', module: 'leads', key: 'convertToProject', value: 'Převést na projekt' },
    { language_code: 'cs', module: 'leads', key: 'convertConfirm', value: 'Převést tento lead na projekt? Lead bude označen jako vyhraný.' },
    { language_code: 'cs', module: 'leads', key: 'convertSuccess', value: 'Lead byl úspěšně převeden na projekt.' },
    { language_code: 'cs', module: 'leads', key: 'visibility', value: 'Viditelnost' },
    { language_code: 'cs', module: 'leads', key: 'visibilityPublic', value: 'Veřejný (všichni uživatelé)' },
    { language_code: 'cs', module: 'leads', key: 'visibilityRestricted', value: 'Omezený (pouze vybrané skupiny)' },
    { language_code: 'cs', module: 'leads', key: 'groups', value: 'Přístupové skupiny' },
    { language_code: 'cs', module: 'leads', key: 'groupsHint', value: 'Tento lead vidí pouze členové vybraných skupin.' },
    { language_code: 'cs', module: 'leads', key: 'convertedFrom', value: 'Převedeno z leadu' },
  ];

  for (const row of keys) {
    await knex('translations').insert(row).onConflict(['language_code', 'key']).ignore();
  }
};

exports.down = async function (knex) {
  const keys = ['convertToProject', 'convertConfirm', 'convertSuccess', 'visibility',
    'visibilityPublic', 'visibilityRestricted', 'groups', 'groupsHint', 'convertedFrom'];
  await knex('translations').where('module', 'leads').whereIn('key', keys).delete();
};
