'use strict';

const { db } = require('../config/database');

const Role = {
  async findById(id) {
    return db('roles').where({ id }).first();
  },

  async findByName(name) {
    return db('roles').where({ name }).first();
  },

  async create({ name, description, is_system = false }) {
    const [role] = await db('roles').insert({ name, description, is_system }).returning('*');
    return role;
  },

  async update(id, { name, description }) {
    const [role] = await db('roles')
      .where({ id })
      .update({ name, description, updated_at: db.fn.now() })
      .returning('*');
    return role;
  },

  async delete(id) {
    return db('roles').where({ id, is_system: false }).delete();
  },

  async list() {
    return db('roles').select('*').orderBy('name');
  },

  async getPermissions(roleId) {
    return db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');
  },

  async assignPermission(roleId, permissionId) {
    await db('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId })
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  },

  async removePermission(roleId, permissionId) {
    return db('role_permissions').where({ role_id: roleId, permission_id: permissionId }).delete();
  },

  async listPermissions() {
    return db('permissions').select('*').orderBy('module').orderBy('name');
  },

  async findPermissionById(id) {
    return db('permissions').where({ id }).first();
  },

  async createPermission({ name, description, module: mod }) {
    const [perm] = await db('permissions').insert({ name, description, module: mod }).returning('*');
    return perm;
  },
};

module.exports = Role;
