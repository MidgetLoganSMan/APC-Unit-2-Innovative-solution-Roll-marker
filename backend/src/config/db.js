import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFile } from 'node:fs/promises';
import config from './env.js';

let databasePromise;

export async function connectDB() {
  if (!databasePromise) {
    databasePromise = open({
      filename: config.dbFile,
      driver: sqlite3.Database
    })
      .then(async (db) => {
        await db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
        return db;
      })
      .catch((error) => {
        databasePromise = undefined;
        throw error;
      });
  }

  return databasePromise;
}

export async function initializeDB() {
  const db = await connectDB();
  const schemaPath = new URL('../../-- SQLite.sql', import.meta.url);
  const schema = await readFile(schemaPath, 'utf8');

  await db.exec(schema);

  const violations = await db.all('PRAGMA foreign_key_check');
  if (violations.length > 0) {
    throw new Error('Database has ' + violations.length + ' foreign key violation(s)');
  }

  return db;
}

export async function closeDB() {
  if (!databasePromise) return;

  const db = await databasePromise;
  await db.close();
  databasePromise = undefined;
}
