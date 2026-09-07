import { connectDB } from '../config/db.js';
import HttpError from '../utils/httpError.js';
import { startOfToday } from '../utils/nfc.js';

const allowedStatuses = new Set(['absent', 'present', 'late', 'excused']);

function positiveId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `${label} must be a positive integer`);
  }
  return id;
}

function attendanceStatus(value) {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!allowedStatuses.has(status)) {
    throw new HttpError(400, 'Status must be absent, present, late, or excused');
  }
  return status;
}

async function getOwnedClass(db, classId, teacherId) {
  const selectedClass = await db.get(
    `SELECT id, className, room, period
     FROM Classes
     WHERE id = ? AND teacherId = ?`,
    positiveId(classId, 'Class ID'),
    teacherId
  );
  if (!selectedClass) throw new HttpError(404, 'Class not found');
  return selectedClass;
}

const rollService = {
  async getTeacherClasses(teacherId) {
    const db = await connectDB();
    return db.all(
      `SELECT id, className, room, period
       FROM Classes
       WHERE teacherId = ?
       ORDER BY period, className`,
      teacherId
    );
  },

  async updateRoll(entryId, newStatus, teacherId) {
    const db = await connectDB();
    const status = attendanceStatus(newStatus);
    const result = await db.run(
      `UPDATE RollEntries
       SET status = ?, source = 'manual', timestamp = ?
       WHERE id = ? AND classId IN (
         SELECT id FROM Classes WHERE teacherId = ?
       )`,
      status,
      Date.now(),
      positiveId(entryId, 'Entry ID'),
      teacherId
    );
    if (result.changes !== 1) throw new HttpError(404, 'Roll entry not found');
    return { success: true, status };
  },

  async updateStudentStatus(classId, studentId, newStatus, teacherId) {
    const db = await connectDB();
    const selectedClass = await getOwnedClass(db, classId, teacherId);
    const parsedStudentId = positiveId(studentId, 'Student ID');
    const status = attendanceStatus(newStatus);
    const student = await db.get(
      `SELECT id FROM Students
       WHERE id = ? AND (
         currentClass = ? OR EXISTS (
           SELECT 1 FROM Timetable
           WHERE Timetable.studentId = Students.id
             AND Timetable.classId = ?
         )
       )`,
      parsedStudentId,
      selectedClass.id,
      selectedClass.id
    );
    if (!student) throw new HttpError(404, 'Student is not in this class');

    const existing = await db.get(
      `SELECT id FROM RollEntries
       WHERE studentId = ? AND classId = ? AND timestamp >= ?
       ORDER BY timestamp DESC, id DESC LIMIT 1`,
      parsedStudentId,
      selectedClass.id,
      startOfToday()
    );
    const timestamp = Date.now();
    let entryId;

    if (existing) {
      await db.run(
        `UPDATE RollEntries
         SET status = ?, source = 'manual', timestamp = ?
         WHERE id = ?`,
        status,
        timestamp,
        existing.id
      );
      entryId = existing.id;
    } else {
      const result = await db.run(
        `INSERT INTO RollEntries
          (studentId, classId, timestamp, status, source)
         VALUES (?, ?, ?, ?, 'manual')`,
        parsedStudentId,
        selectedClass.id,
        timestamp,
        status
      );
      entryId = result.lastID;
    }

    return { success: true, entryId, status, timestamp, source: 'manual' };
  },

  async getClassRoll(classId, teacherId) {
    const db = await connectDB();
    const selectedClass = await getOwnedClass(db, classId, teacherId);
    const entries = await db.all(
      `SELECT
        Students.id AS studentId,
        Students.name,
        Students.email,
        CASE WHEN Students.nfcTagId IS NULL THEN 0 ELSE 1 END AS nfcLinked,
        RollEntries.id AS entryId,
        COALESCE(RollEntries.status, 'absent') AS status,
        RollEntries.timestamp,
        RollEntries.source
      FROM Students
      LEFT JOIN RollEntries ON RollEntries.id = (
        SELECT latest.id
        FROM RollEntries AS latest
        WHERE latest.studentId = Students.id
          AND latest.classId = ?
          AND latest.timestamp >= ?
        ORDER BY latest.timestamp DESC, latest.id DESC
        LIMIT 1
      )
      WHERE Students.currentClass = ? OR EXISTS (
        SELECT 1 FROM Timetable
        WHERE Timetable.studentId = Students.id
          AND Timetable.classId = ?
      )
      ORDER BY Students.name`,
      selectedClass.id,
      startOfToday(),
      selectedClass.id,
      selectedClass.id
    );

    return {
      class: selectedClass,
      students: entries.map((entry) => ({
        ...entry,
        nfcLinked: Boolean(entry.nfcLinked)
      }))
    };
  }
};

export default rollService;
