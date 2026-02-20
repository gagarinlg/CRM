'use strict';

const { db } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');

const SAFE_FIELDS = [
  'id', 'email', 'username', 'first_name', 'last_name',
  'is_active', 'force_password_change', 'last_login', 'created_at', 'updated_at',
];

const User = {
  async findById(id) {
    return db('users').select(SAFE_FIELDS).where({ id }).whereNull('deleted_at').first();
  },

  async findByEmail(email) {
    return db('users').where({ email }).whereNull('deleted_at').first();
  },

  async findByUsername(username) {
    return db('users').where({ username }).whereNull('deleted_at').first();
  },

  async create({ email, username, password, first_name, last_name, is_active = true, force_password_change = false }) {
    const password_hash = await hashPassword(password);
    const [user] = await db('users')
      .insert({ email, username, password_hash, first_name, last_name, is_active, force_password_change })
      .returning(SAFE_FIELDS);
    return user;
  },

  async update(id, fields) {
    const allowed = ['email', 'username', 'first_name', 'last_name', 'is_active', 'force_password_change'];
    const data = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    data.updated_at = db.fn.now();
    const [user] = await db('users').where({ id }).whereNull('deleted_at').update(data).returning(SAFE_FIELDS);
    return user;
  },

  async softDelete(id) {
    return db('users').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, is_active, role } = {}) {
    const offset = (page - 1) * limit;
    let query = db('users').whereNull('deleted_at');

    if (search) {
      query = query.where((b) =>
        b.whereILike('email', `%${search}%`)
          .orWhereILike('username', `%${search}%`)
          .orWhereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`),
      );
    }
    if (is_active !== undefined) query = query.where({ is_active });
    if (role) {
      query = query.whereIn('id', db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('roles.name', role)
        .select('user_roles.user_id'));
    }

    const [{ count }] = await query.clone().count('* as count');
    const data = await query.select(SAFE_FIELDS).orderBy('created_at', 'desc').limit(limit).offset(offset);
    return { data, total: parseInt(count, 10) };
  },

  async updateLastLogin(id) {
    return db('users').where({ id }).update({ last_login: db.fn.now() });
  },

  async changePassword(id, newPassword) {
    const password_hash = await hashPassword(newPassword);
    return db('users').where({ id }).update({ password_hash, force_password_change: false, updated_at: db.fn.now() });
  },

  async verifyPassword(id, plainPassword) {
    const user = await db('users').where({ id }).first();
    if (!user) return false;
    return comparePassword(plainPassword, user.password_hash);
  },

  async getUserRoles(userId) {
    return db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.id', 'roles.name', 'roles.description');
  },

  async getUserPermissions(userId) {
    return db('user_roles')
      .join('role_permissions', 'user_roles.role_id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('user_roles.user_id', userId)
      .distinct('permissions.id', 'permissions.name', 'permissions.module', 'permissions.description');
  },

  async assignRole(userId, roleId) {
    await db('user_roles').insert({ user_id: userId, role_id: roleId }).onConflict(['user_id', 'role_id']).ignore();
  },

  async removeRole(userId, roleId) {
    return db('user_roles').where({ user_id: userId, role_id: roleId }).delete();
  },
};

module.exports = User;
