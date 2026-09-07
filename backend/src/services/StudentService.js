import { connectDB } from '../config/db.js';
import HttpError from '../utils/httpError.js';
import { normalizeTagId } from '../utils/nfc.js';

function positiveId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `${label} must be a positive integer`);
  }
  return id;
}

async function getOwnedStudent(db, studentId, teacherId) {
  const student = await db.get(
    `SELECT
      Students.id,
      Students.name,
      Students.email,
      Students.nfcTagId,
      Students.currentClass,
      Classes.className
    FROM Students
    JOIN Classes ON Classes.id = Students.currentClass
    WHERE Students.id = ? AND Classes.teacherId = ?`,
    positiveId(studentId, 'Student ID'),
    teacherId
  );

  if (!student) throw new HttpError(404, 'Student not found');
  return student;
}

const studentService = {
  async searchStudent(name, teacherId) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Student name is required');
    }

    const db = await connectDB();
    const student = await db.get(
      `SELECT Students.*
       FROM Students
       JOIN Classes ON Classes.id = Students.currentClass
       WHERE Students.name LIKE ? AND Classes.teacherId = ?
       ORDER BY Students.name`,
      `%${name.trim()}%`,
      teacherId
    );
    if (!student) throw new HttpError(404, 'Student not found');
    return student;
  },

  async linkNfcTag(studentId, rawTagId, teacherId) {
    const tagId = normalizeTagId(rawTagId);
    const db = await connectDB();
    const student = await getOwnedStudent(db, studentId, teacherId);
    const linkedStudent = await db.get(
      `SELECT id, name FROM Students
       WHERE UPPER(REPLACE(REPLACE(TRIM(nfcTagId), ' ', ''), ':', '')) = ?
         AND id <> ?`,
      tagId,
      student.id
    );

    if (linkedStudent) {
      throw new HttpError(409, `That NFC card is already linked to ${linkedStudent.name}`);
    }

    await db.run('UPDATE Students SET nfcTagId = ? WHERE id = ?', tagId, student.id);
    return {
      ...student,
      nfcTagId: tagId,
      nfcLinked: true
    };
  },

  async unlinkNfcTag(studentId, teacherId) {
    const db = await connectDB();
    const student = await getOwnedStudent(db, studentId, teacherId);
    await db.run('UPDATE Students SET nfcTagId = NULL WHERE id = ?', student.id);
    return { ...student, nfcTagId: null, nfcLinked: false };
  }
};

export default studentService;
