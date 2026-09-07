async function makeNfcTagsOptional(db) {
  const columns = await db.all('PRAGMA table_info(Students)');
  const nfcColumn = columns.find((column) => column.name === 'nfcTagId');

  if (!nfcColumn || nfcColumn.notnull === 0) return;

  await db.exec('PRAGMA foreign_keys = OFF');
  try {
    await db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE Students_migrated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        nfcTagId TEXT UNIQUE,
        currentLocation TEXT,
        currentClass INTEGER,
        FOREIGN KEY (currentClass) REFERENCES Classes(id)
      );
      INSERT INTO Students_migrated
        (id, name, email, nfcTagId, currentLocation, currentClass)
      SELECT id, name, email, nfcTagId, currentLocation, currentClass
      FROM Students;
      DROP TABLE Students;
      ALTER TABLE Students_migrated RENAME TO Students;
      COMMIT;
    `);
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  } finally {
    await db.exec('PRAGMA foreign_keys = ON');
  }
}

export default async function runMigrations(db) {
  await makeNfcTagsOptional(db);
}
