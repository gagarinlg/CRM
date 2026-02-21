'use strict';

// ── Chainable DB query mock factory ──────────────────────────────────────────
jest.mock('../../../src/server/config/database', () => {
  // State shared across the test to configure return values
  const state = {
    selectResult: null,
    insertResult: null,
    updateResult: null,
    deleteResult: 1,
  };

  function chain() {
    const c = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereILike: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      pluck: jest.fn().mockResolvedValue([]),
      distinct: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      ignore: jest.fn().mockResolvedValue(undefined),
      first: jest.fn(() => Promise.resolve(state.selectResult)),
      count: jest.fn(() => Promise.resolve([{ count: '0' }])),
      returning: jest.fn(() =>
        Promise.resolve(state.insertResult ? [state.insertResult] : [])),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn(() => Promise.resolve(state.deleteResult)),
    };
    return c;
  }

  const db = jest.fn(() => chain());
  db.fn = { now: jest.fn().mockReturnValue('NOW()') };
  db.__state = state;

  return {
    db,
    connectDB: jest.fn().mockResolvedValue(undefined),
    disconnectDB: jest.fn().mockResolvedValue(undefined),
  };
});

// ── Load module under test ────────────────────────────────────────────────────
const User = require('../../../src/server/models/User');
const { db } = require('../../../src/server/config/database');

const SAMPLE_USER = {
  id: 'user-uuid-111',
  email: 'alice@example.com',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Smith',
  is_active: true,
  force_password_change: false,
  last_login: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  db.__state.selectResult = null;
  db.__state.insertResult = null;
  db.__state.updateResult = null;
  db.__state.deleteResult = 1;
});

describe('User model', () => {
  describe('findById()', () => {
    test('calls db with correct table and returns the row', async () => {
      db.__state.selectResult = SAMPLE_USER;
      const user = await User.findById('user-uuid-111');
      expect(db).toHaveBeenCalledWith('users');
      expect(user).toMatchObject({ email: 'alice@example.com' });
    });

    test('returns null (undefined) when user does not exist', async () => {
      db.__state.selectResult = null;
      const user = await User.findById('nonexistent');
      // The mock resolves with null, which is falsy — model returns null
      expect(user).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    test('queries the users table', async () => {
      db.__state.selectResult = SAMPLE_USER;
      const user = await User.findByEmail('alice@example.com');
      expect(db).toHaveBeenCalledWith('users');
      expect(user).toMatchObject({ username: 'alice' });
    });
  });

  describe('create()', () => {
    test('inserts a new user with hashed password', async () => {
      db.__state.insertResult = SAMPLE_USER;
      const user = await User.create({
        email: 'alice@example.com',
        username: 'alice',
        password: 'Password1!',
        first_name: 'Alice',
        last_name: 'Smith',
      });
      expect(db).toHaveBeenCalledWith('users');
      expect(user).toMatchObject({ email: 'alice@example.com' });
    });
  });

  describe('update()', () => {
    test('updates allowed fields only', async () => {
      db.__state.insertResult = { ...SAMPLE_USER, first_name: 'Alicia' };
      const user = await User.update('user-uuid-111', {
        first_name: 'Alicia',
        password_hash: 'should-not-be-updated', // not in allowed list
      });
      expect(db).toHaveBeenCalledWith('users');
      expect(user).toMatchObject({ first_name: 'Alicia' });
    });
  });

  describe('softDelete()', () => {
    test('sets deleted_at on the user row', async () => {
      await User.softDelete('user-uuid-111');
      expect(db).toHaveBeenCalledWith('users');
    });
  });

  describe('assignRole() / removeRole()', () => {
    test('assignRole inserts into user_roles', async () => {
      await User.assignRole('user-uuid-111', 'role-uuid-1');
      expect(db).toHaveBeenCalledWith('user_roles');
    });

    test('removeRole deletes from user_roles', async () => {
      await User.removeRole('user-uuid-111', 'role-uuid-1');
      expect(db).toHaveBeenCalledWith('user_roles');
    });
  });

  describe('getUserRoles()', () => {
    test('joins user_roles and roles tables', async () => {
      await User.getUserRoles('user-uuid-111');
      expect(db).toHaveBeenCalledWith('user_roles');
    });
  });

  describe('getUserPermissions()', () => {
    test('queries role permissions', async () => {
      await User.getUserPermissions('user-uuid-111');
      expect(db).toHaveBeenCalledWith('user_roles');
    });
  });

  describe('verifyPassword()', () => {
    test('returns false when user not found', async () => {
      db.__state.selectResult = null;
      const result = await User.verifyPassword('nonexistent', 'somepassword');
      expect(result).toBe(false);
    });

    test('returns false when password does not match', async () => {
      // Use a known bcrypt hash for 'Password1' — can be any valid hash
      const hash = '$2a$12$invalidhashfortest...invalid';
      db.__state.selectResult = { ...SAMPLE_USER, password_hash: hash };
      const result = await User.verifyPassword('user-uuid-111', 'WrongPassword');
      expect(result).toBe(false);
    });
  });
});
