import { closeDB, initializeDB } from '../src/config/db.js';

try {
  const db = await initializeDB();
  const counts = await db.get(
    'SELECT ' +
      '(SELECT COUNT(*) FROM Teachers) AS teachers, ' +
      '(SELECT COUNT(*) FROM Classes) AS classes, ' +
      '(SELECT COUNT(*) FROM Students) AS students, ' +
      '(SELECT COUNT(*) FROM RollEntries) AS rollEntries, ' +
      '(SELECT COUNT(*) FROM Timetable) AS timetableEntries'
  );

  console.log('Database setup complete:', counts);
} catch (error) {
  console.error('Database setup failed:', error);
  process.exitCode = 1;
} finally {
  await closeDB();
}
