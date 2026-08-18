import { closeDB, initializeDB } from '../src/config/db.js';

const sampleTagId = 'NFC-SAMPLE-001';
let db;
let transactionStarted = false;

try {
  db = await initializeDB();

  const foreignKeys = await db.get('PRAGMA foreign_keys');
  if (foreignKeys.foreign_keys !== 1) {
    throw new Error('Foreign key enforcement is disabled');
  }

  const sampleQuery = [
    'SELECT RollEntries.id, Students.name AS student,',
    'Classes.className AS className, Teachers.name AS teacher,',
    'RollEntries.status, RollEntries.source',
    'FROM RollEntries',
    'JOIN Students ON Students.id = RollEntries.studentId',
    'JOIN Classes ON Classes.id = RollEntries.classId',
    'JOIN Teachers ON Teachers.id = Classes.teacherId',
    'WHERE Students.nfcTagId = ?',
    'AND RollEntries.source = \'sample\''
  ].join(' ');
  const sample = await db.get(sampleQuery, sampleTagId);

  if (!sample) {
    throw new Error('The linked sample roll entry was not found');
  }

  await db.exec('BEGIN TRANSACTION');
  transactionStarted = true;

  const insertQuery = [
    'INSERT INTO RollEntries',
    '(studentId, classId, timestamp, status, source)',
    'SELECT id, currentClass, ?, \'late\', \'verification\'',
    'FROM Students WHERE nfcTagId = ?'
  ].join(' ');
  const inserted = await db.run(insertQuery, Date.now(), sampleTagId);

  if (inserted.changes !== 1) {
    throw new Error('Could not create a verification roll entry');
  }

  await db.run(
    'UPDATE RollEntries SET status = \'present\' WHERE id = ?',
    inserted.lastID
  );
  const verifiedEntry = await db.get(
    'SELECT status FROM RollEntries WHERE id = ?',
    inserted.lastID
  );

  if (verifiedEntry?.status !== 'present') {
    throw new Error('Could not read the updated verification entry');
  }

  await db.exec('ROLLBACK');
  transactionStarted = false;

  console.log('Database verification passed. Sample entry:', sample);
} catch (error) {
  if (transactionStarted) {
    await db.exec('ROLLBACK');
  }
  console.error('Database verification failed:', error);
  process.exitCode = 1;
} finally {
  await closeDB();
}
