// Multiple Database Support Tests

describe('MultiDatabase', () => {
  
  beforeEach(() => {
    window.__kbbMultiDatabase.databases = [];
    window.__kbbMultiDatabase.currentDatabaseId = null;
  });

  describe('Database Registration', () => {
    test('should register a database', () => {
      const db = window.__kbbMultiDatabase.registerDatabase({
        name: 'Personal',
        path: '/path/to/personal.kdbx'
      });

      expect(db.id).toBeDefined();
      expect(db.name).toBe('Personal');
      expect(db.path).toBe('/path/to/personal.kdbx');
    });

    test('should set database as active', () => {
      const db = window.__kbbMultiDatabase.registerDatabase({
        name: 'Work',
        isActive: true
      });

      expect(window.__kbbMultiDatabase.currentDatabaseId).toBe(db.id);
    });

    test('should generate unique IDs', () => {
      const db1 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1' });
      const db2 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB2' });

      expect(db1.id).not.toBe(db2.id);
    });
  });

  describe('Database Switching', () => {
    test('should switch to different database', () => {
      const db1 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1', isActive: true });
      const db2 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB2' });

      window.__kbbMultiDatabase.switchDatabase(db2.id);

      expect(window.__kbbMultiDatabase.currentDatabaseId).toBe(db2.id);
      expect(db2.isActive).toBe(true);
      expect(db1.isActive).toBe(false);
    });

    test('should return false for invalid database', () => {
      const result = window.__kbbMultiDatabase.switchDatabase('invalid_id');
      expect(result).toBe(false);
    });

    test('should update lastAccessed on switch', () => {
      const db = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1' });
      const oldTime = db.lastAccessed;

      window.__kbbMultiDatabase.switchDatabase(db.id);

      expect(db.lastAccessed).toBeGreaterThan(oldTime);
    });
  });

  describe('Database Retrieval', () => {
    test('should get current database', () => {
      const db = window.__kbbMultiDatabase.registerDatabase({ name: 'Current', isActive: true });
      const current = window.__kbbMultiDatabase.getCurrentDatabase();

      expect(current.id).toBe(db.id);
      expect(current.name).toBe('Current');
    });

    test('should get all databases sorted by recent', () => {
      const db1 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1' });
      window.__kbbMultiDatabase.registerDatabase({ name: 'DB2' });
      window.__kbbMultiDatabase.switchDatabase(db1.id);

      const all = window.__kbbMultiDatabase.getAllDatabases();
      expect(all[0].id).toBe(db1.id);
    });
  });

  describe('Database Removal', () => {
    test('should remove a database', () => {
      const db1 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1', isActive: true });
      const db2 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB2' });

      window.__kbbMultiDatabase.removeDatabase(db1.id);

      expect(window.__kbbMultiDatabase.databases.length).toBe(1);
      expect(window.__kbbMultiDatabase.databases[0].id).toBe(db2.id);
    });

    test('should switch to another database when removing active', () => {
      const db1 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1', isActive: true });
      const db2 = window.__kbbMultiDatabase.registerDatabase({ name: 'DB2' });

      window.__kbbMultiDatabase.removeDatabase(db1.id);

      expect(window.__kbbMultiDatabase.currentDatabaseId).toBe(db2.id);
    });

    test('should return false for invalid database', () => {
      const result = window.__kbbMultiDatabase.removeDatabase('invalid_id');
      expect(result).toBe(false);
    });
  });

  describe('Database Updates', () => {
    test('should update database info', () => {
      const db = window.__kbbMultiDatabase.registerDatabase({ name: 'DB1' });

      window.__kbbMultiDatabase.updateDatabase(db.id, {
        name: 'Updated DB',
        entryCount: 50
      });

      const updated = window.__kbbMultiDatabase.databases[0];
      expect(updated.name).toBe('Updated DB');
      expect(updated.entryCount).toBe(50);
    });

    test('should return false for invalid database', () => {
      const result = window.__kbbMultiDatabase.updateDatabase('invalid_id', { name: 'New' });
      expect(result).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    test('should resolve conflict by keeping local', () => {
      const conflict = {
        localTime: Date.now(),
        remoteTime: Date.now() - 1000
      };

      const resolution = window.__kbbMultiDatabase.resolveConflict(conflict);
      expect(resolution).toBe('keep_local');
    });

    test('should resolve conflict by keeping remote', () => {
      const conflict = {
        localTime: Date.now() - 1000,
        remoteTime: Date.now()
      };

      const resolution = window.__kbbMultiDatabase.resolveConflict(conflict);
      expect(resolution).toBe('keep_remote');
    });

    test('should merge when times are equal', () => {
      const time = Date.now();
      const conflict = {
        localTime: time,
        remoteTime: time
      };

      const resolution = window.__kbbMultiDatabase.resolveConflict(conflict);
      expect(resolution).toBe('merge');
    });
  });

  describe('Statistics', () => {
    test('should get database statistics', () => {
      const db = window.__kbbMultiDatabase.registerDatabase({
        name: 'TestDB',
        entryCount: 25
      });

      const stats = window.__kbbMultiDatabase.getStatistics(db.id);

      expect(stats.name).toBe('TestDB');
      expect(stats.entryCount).toBe(25);
      expect(stats.isActive).toBe(false);
    });

    test('should return null for invalid database', () => {
      const stats = window.__kbbMultiDatabase.getStatistics('invalid_id');
      expect(stats).toBeNull();
    });
  });
});
