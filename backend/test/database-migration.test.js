import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import runMigrations from '../src/config/migrations.js';

test('existing databases are migrated to allow students without a card', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'roll-marker-migration-'));
  const db = await open({
    filename: path.join(directory, 'legacy.sqlite'),
    driver: sqlite3.Database
  });

  try {
    await db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE Classes (id INTEGER PRIMARY KEY);
      CREATE TABLE Students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        nfcTagId TEXT UNIQUE NOT NULL,
        currentLocation TEXT,
        currentClass INTEGER,
        FOREIGN KEY (currentClass) REFERENCES Classes(id)
      );
      CREATE TABLE RollEntries (
        id INTEGER PRIMARY KEY,
        studentId INTEGER REFERENCES Students(id)
      );
      INSERT INTO Classes (id) VALUES (1);
      INSERT INTO Students (name, nfcTagId, currentClass)
      VALUES ('Existing Student', 'OLD-CARD', 1);
    `);

    await runMigrations(db);

    const columns = await db.all('PRAGMA table_info(Students)');
    const nfcColumn = columns.find((column) => column.name === 'nfcTagId');
    assert.equal(nfcColumn.notnull, 0);
    assert.equal(
      (await db.get("SELECT nfcTagId FROM Students WHERE name = 'Existing Student'"))
        .nfcTagId,
      'OLD-CARD'
    );
    assert.deepEqual(await db.all('PRAGMA foreign_key_check'), []);
  } finally {
    await db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
