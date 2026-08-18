import { closeDB, initializeDB } from '../src/config/db.js';

const [name, email, nfcTagId, classIdValue] = process.argv.slice(2);
const classId = Number(classIdValue);
let db;
let transactionStarted = false;

if (!name || !email || !nfcTagId || !Number.isInteger(classId)) {
  console.error('Usage: npm run student:add -- <name> <email> <nfcTagId> <classId>');
  process.exitCode = 1;
} else {
  try {
    db = await initializeDB();
    const selectedClass = await db.get(
      'SELECT id, room, period FROM Classes WHERE id = ?',
      classId
    );

    if (!selectedClass) {
      throw new Error('Class not found. Check the class ID and try again.');
    }

    await db.exec('BEGIN TRANSACTION');
    transactionStarted = true;

    const result = await db.run(
      'INSERT INTO Students ' +
        '(name, email, nfcTagId, currentLocation, currentClass) ' +
        'VALUES (?, ?, ?, ?, ?)',
      name.trim(),
      email.trim().toLowerCase(),
      nfcTagId.trim(),
      selectedClass.room,
      selectedClass.id
    );
    await db.run(
      'INSERT INTO Timetable (studentId, classId, period) VALUES (?, ?, ?)',
      result.lastID,
      selectedClass.id,
      selectedClass.period
    );

    await db.exec('COMMIT');
    transactionStarted = false;
    console.log(
      'Student added with ID ' + result.lastID +
        ' and linked to NFC tag ' + nfcTagId.trim()
    );
  } catch (error) {
    if (transactionStarted) {
      await db.exec('ROLLBACK');
    }
    if (error.message.includes('Students.nfcTagId')) {
      console.error('That NFC tag is already linked to another student.');
    } else if (error.message.includes('Students.email')) {
      console.error('A student with that email already exists.');
    } else {
      console.error('Could not add student:', error.message);
    }
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}
