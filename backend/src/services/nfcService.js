import { connectDB } from '../config/db.js';
import HttpError from '../utils/httpError.js';
import { normalizeTagId, startOfToday } from '../utils/nfc.js';

let tapQueue = Promise.resolve();

async function recordTap(rawTagId) {
    const tagId = normalizeTagId(rawTagId);
    const db = await connectDB();
    const student = await db.get(
      `SELECT
        Students.id,
        Students.name,
        Students.currentClass AS classId,
        Classes.className
      FROM Students
      LEFT JOIN Classes ON Classes.id = Students.currentClass
      WHERE UPPER(REPLACE(REPLACE(TRIM(Students.nfcTagId), ' ', ''), ':', '')) = ?`,
      tagId
    );

    if (!student) throw new HttpError(404, 'Unknown NFC tag');
    if (!student.classId) {
      throw new HttpError(409, 'This student is not assigned to a class');
    }

    let transactionStarted = false;
    try {
      await db.exec('BEGIN IMMEDIATE');
      transactionStarted = true;

      const existingEntry = await db.get(
        `SELECT id
         FROM RollEntries
         WHERE studentId = ? AND classId = ? AND timestamp >= ?
         ORDER BY timestamp DESC, id DESC
         LIMIT 1`,
        student.id,
        student.classId,
        startOfToday()
      );

      const timestamp = Date.now();
      let entryId;
      if (existingEntry) {
        await db.run(
          `UPDATE RollEntries
           SET status = 'present', source = 'NFC', timestamp = ?
           WHERE id = ?`,
          timestamp,
          existingEntry.id
        );
        entryId = existingEntry.id;
      } else {
        const result = await db.run(
          `INSERT INTO RollEntries
            (studentId, classId, timestamp, status, source)
           VALUES (?, ?, ?, 'present', 'NFC')`,
          student.id,
          student.classId,
          timestamp
        );
        entryId = result.lastID;
      }

      await db.exec('COMMIT');
      transactionStarted = false;

      return {
        message: `Welcome ${student.name}`,
        student,
        attendance: {
          entryId,
          status: 'present',
          source: 'NFC',
          timestamp
        }
      };
    } catch (error) {
      if (transactionStarted) await db.exec('ROLLBACK');
      throw error;
    }
}

const nfcService = {
  processTap(rawTagId) {
    const queuedTap = tapQueue.then(
      () => recordTap(rawTagId),
      () => recordTap(rawTagId)
    );
    tapQueue = queuedTap.catch(() => undefined);
    return queuedTap;
  }
};

export default nfcService;
