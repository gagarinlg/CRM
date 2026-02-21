exports.up = async (knex) => {
  await knex.schema.createTable('lead_contacts', (table) => {
    table.uuid('lead_id').notNullable().references('id').inTable('leads').onDelete('CASCADE');
    table.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    table.primary(['lead_id', 'contact_id']);
  });

  await knex.schema.createTable('lead_members', (table) => {
    table.uuid('lead_id').notNullable().references('id').inTable('leads').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role', 50);
    table.primary(['lead_id', 'user_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('lead_members');
  await knex.schema.dropTableIfExists('lead_contacts');
};
