'use strict';

// Build a chainable knex query-builder mock that records which table names are used.
const makeQueryBuilder = () => {
  const qb = {};
  const chain = () => qb;
  qb.where   = chain;
  qb.first   = jest.fn().mockResolvedValue(null); // no existing demo data by default
  qb.insert  = jest.fn().mockReturnValue(qb);
  qb.returning = jest.fn().mockImplementation(() => {
    // Return an array of stub records with an id so foreign-key inserts work
    return Promise.resolve([
      { id: 'id-1' }, { id: 'id-2' }, { id: 'id-3' }, { id: 'id-4' },
    ]);
  });
  return qb;
};

// Track every table name passed to trx('tableName')
const tablesInsertedInto = [];
const makeTransaction = () => {
  const trx = jest.fn((tableName) => {
    tablesInsertedInto.push(tableName);
    return makeQueryBuilder();
  });
  return trx;
};

// db('companies').where(...).first() is called once outside the transaction
// to check for existing demo data.
const outsideQb = makeQueryBuilder();
outsideQb.first.mockResolvedValue(null); // no pre-existing data

const mockDb = jest.fn((tableName) => {
  tablesInsertedInto.push(tableName);
  return outsideQb;
});
mockDb.transaction = jest.fn((fn) => fn(makeTransaction()));

jest.mock('../../../src/server/config/database', () => ({
  db: mockDb,
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

// Re-require the service after the mock is in place
const demoDataService = require('../../../src/server/services/demoDataService');

beforeEach(() => {
  tablesInsertedInto.length = 0;
  jest.clearAllMocks();
  // Reset: no pre-existing demo data
  outsideQb.first.mockResolvedValue(null);
});

describe('demoDataService.load', () => {
  test('uses correct table name "events" (not "calendar_events")', async () => {
    await demoDataService.load('user-uuid-1');
    expect(tablesInsertedInto).toContain('events');
    expect(tablesInsertedInto).not.toContain('calendar_events');
  });

  test('uses correct table names for all entities', async () => {
    await demoDataService.load('user-uuid-1');
    const expected = ['tags', 'companies', 'contacts', 'contact_phones', 'groups', 'group_members', 'projects', 'project_groups', 'leads', 'lead_groups', 'notes', 'events', 'entity_tags'];
    for (const table of expected) {
      expect(tablesInsertedInto).toContain(table);
    }
  });

  test('returns loaded counts on success', async () => {
    const result = await demoDataService.load('user-uuid-1');
    expect(result.loaded).toBe(true);
    expect(result.counts).toMatchObject({
      companies: 3, contacts: 4, groups: 2, tags: 4, projects: 3, leads: 4, notes: 5, events: 3,
    });
  });

  test('returns alreadyLoaded:true when demo data already exists', async () => {
    outsideQb.first.mockResolvedValue({ id: 'existing-id', name: 'Acme Corporation' });
    const result = await demoDataService.load('user-uuid-1');
    expect(result.alreadyLoaded).toBe(true);
    // transaction should not have been called
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  test('does not use "user_id" column for events — uses "created_by"', async () => {
    // Capture the insert call arguments for the events table
    let eventsInsertArgs = null;
    const trxWithCapture = jest.fn((tableName) => {
      const qb = makeQueryBuilder();
      if (tableName === 'events') {
        qb.insert = jest.fn((rows) => {
          eventsInsertArgs = rows;
          return qb;
        });
      }
      return qb;
    });
    mockDb.transaction.mockImplementationOnce((fn) => fn(trxWithCapture));

    await demoDataService.load('user-uuid-1');

    expect(eventsInsertArgs).not.toBeNull();
    // Every row should have created_by, not user_id
    for (const row of eventsInsertArgs) {
      expect(row).toHaveProperty('created_by', 'user-uuid-1');
      expect(row).not.toHaveProperty('user_id');
    }
  });

  test('does not use "job_title" column for contacts — uses "position"', async () => {
    let contactsInsertArgs = null;
    const trxWithCapture = jest.fn((tableName) => {
      const qb = makeQueryBuilder();
      if (tableName === 'contacts') {
        qb.insert = jest.fn((rows) => {
          contactsInsertArgs = rows;
          return qb;
        });
      }
      return qb;
    });
    mockDb.transaction.mockImplementationOnce((fn) => fn(trxWithCapture));

    await demoDataService.load('user-uuid-1');

    expect(contactsInsertArgs).not.toBeNull();
    for (const row of contactsInsertArgs) {
      expect(row).toHaveProperty('position');
      expect(row).not.toHaveProperty('job_title');
    }
  });
});
