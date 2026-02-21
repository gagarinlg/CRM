'use strict';

const { db } = require('../config/database');

const Tag = {
  async findById(id) {
    return db('tags').where({ id }).first();
  },

  async list() {
    return db('tags').orderBy('name', 'asc');
  },

  async create(data) {
    const { name, color } = data;
    const [tag] = await db('tags').insert({ name, color }).returning('*');
    return tag;
  },

  async update(id, data) {
    const fields = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.color !== undefined) fields.color = data.color;
    fields.updated_at = db.fn.now();
    const [tag] = await db('tags').where({ id }).update(fields).returning('*');
    return tag;
  },

  async delete(id) {
    return db('tags').where({ id }).delete();
  },

  async getTagsForEntity(entityType, entityId) {
    return db('entity_tags')
      .join('tags', 'entity_tags.tag_id', 'tags.id')
      .where({ 'entity_tags.entity_type': entityType, 'entity_tags.entity_id': entityId })
      .select('tags.id', 'tags.name', 'tags.color');
  },

  async addTagToEntity(entityType, entityId, tagId) {
    await db('entity_tags')
      .insert({ entity_type: entityType, entity_id: entityId, tag_id: tagId })
      .onConflict(['entity_type', 'entity_id', 'tag_id'])
      .ignore();
  },

  async removeTagFromEntity(entityType, entityId, tagId) {
    return db('entity_tags')
      .where({ entity_type: entityType, entity_id: entityId, tag_id: tagId })
      .delete();
  },
};

module.exports = Tag;
