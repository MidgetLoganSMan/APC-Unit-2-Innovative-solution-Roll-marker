import { closeDB, initializeDB } from '../src/config/db.js';

const [className, teacherEmail, room, periodValue] = process.argv.slice(2);
const period = Number(periodValue);

if (!className || !teacherEmail || !room || !Number.isInteger(period)) {
  console.error('Usage: npm run class:add -- <className> <teacherEmail> <room> <period>');
  process.exitCode = 1;
} else {
  try {
    const db = await initializeDB();
    const teacher = await db.get(
      'SELECT id FROM Teachers WHERE email = ?',
      teacherEmail.trim().toLowerCase()
    );

    if (!teacher) {
      throw new Error('Teacher not found. Add the teacher before adding their class.');
    }

    const result = await db.run(
      'INSERT INTO Classes (className, teacherId, room, period) VALUES (?, ?, ?, ?)',
      className.trim(),
      teacher.id,
      room.trim(),
      period
    );

    console.log('Class added with ID ' + result.lastID + ': ' + className);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.error('That teacher already has this class in the selected period.');
    } else {
      console.error('Could not add class:', error.message);
    }
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}
