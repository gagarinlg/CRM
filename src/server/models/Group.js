'use strict';

const { db } = require('../config/database');

const Group = {
  async findById(id) {
    return db('groups').where({ id }).first();
  },

  async create({ name, description, created_by }) {
    const [group] = await db('groups').insert({ name, description, created_by }).returning('*');
    return group;
  },

  async update(id, { name, description }) {
    const [group] = await db('groups')
      .where({ id })
      .update({ name, description, updated_at: db.fn.now() })
      .returning('*');
    return group;
  },

  async delete(id) {
    return db('groups').where({ id }).delete();
  },

  async list({ search } = {}) {
    let query = db('groups').select('groups.*')
      .count('group_members.user_id as member_count')
      .leftJoin('group_members', 'groups.id', 'group_members.group_id')
      .groupBy('groups.id')
      .orderBy('groups.name');

    if (search) {
      query = query.whereILike('groups.name', `%${search}%`);
    }
    return query;
  },

  async addMember(groupId, userId) {
    await db('group_members')
      .insert({ group_id: groupId, user_id: userId })
      .onConflict(['group_id', 'user_id'])
      .ignore();
  },

  async removeMember(groupId, userId) {
    return db('group_members').where({ group_id: groupId, user_id: userId }).delete();
  },

  async getMembers(groupId) {
    return db('group_members')
      .join('users', 'group_members.user_id', 'users.id')
      .where('group_members.group_id', groupId)
      .whereNull('users.deleted_at')
      .select('users.id', 'users.email', 'users.username', 'users.first_name', 'users.last_name');
  },

  async assignRole(groupId, roleId) {
    await db('group_roles')
      .insert({ group_id: groupId, role_id: roleId })
      .onConflict(['group_id', 'role_id'])
      .ignore();
  },

  async removeRole(groupId, roleId) {
    return db('group_roles').where({ group_id: groupId, role_id: roleId }).delete();
  },

  async getRoles(groupId) {
    return db('group_roles')
      .join('roles', 'group_roles.role_id', 'roles.id')
      .where('group_roles.group_id', groupId)
      .select('roles.id', 'roles.name', 'roles.description');
  },
};

module.exports = Group;
