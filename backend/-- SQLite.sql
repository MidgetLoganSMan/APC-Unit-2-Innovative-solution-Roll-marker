-- SQLite schema and repeatable sample data for the roll marker.
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS Teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    className TEXT NOT NULL,
    teacherId INTEGER NOT NULL,
    room TEXT,
    period INTEGER,
    FOREIGN KEY (teacherId) REFERENCES Teachers(id)
);

CREATE TABLE IF NOT EXISTS Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    nfcTagId TEXT UNIQUE NOT NULL,
    currentLocation TEXT,
    currentClass INTEGER,
    FOREIGN KEY (currentClass) REFERENCES Classes(id)
);

CREATE TABLE IF NOT EXISTS RollEntries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    classId INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    FOREIGN KEY (studentId) REFERENCES Students(id),
    FOREIGN KEY (classId) REFERENCES Classes(id)
);

CREATE TABLE IF NOT EXISTS Timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    classId INTEGER NOT NULL,
    period INTEGER NOT NULL,
    FOREIGN KEY (studentId) REFERENCES Students(id),
    FOREIGN KEY (classId) REFERENCES Classes(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_identity
    ON Classes (className, teacherId, period);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_identity
    ON Timetable (studentId, classId, period);
CREATE INDEX IF NOT EXISTS idx_roll_entries_class_timestamp
    ON RollEntries (classId, timestamp DESC);

-- Sample teacher login: teacher@example.com / password123
INSERT INTO Teachers (name, email, passwordHash)
SELECT
    'Mr Smith',
    'teacher@example.com',
    '$2b$10$sFIIC0NUNp52IRPsW7BxoOvoTx5eywkStcEjavulfHVZHAzKz30r.'
WHERE NOT EXISTS (
    SELECT 1 FROM Teachers WHERE email = 'teacher@example.com'
);

INSERT INTO Classes (className, teacherId, room, period)
SELECT 'Year 10 Computing', id, 'B12', 1
FROM Teachers
WHERE email = 'teacher@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM Classes
      WHERE Classes.className = 'Year 10 Computing'
        AND Classes.teacherId = Teachers.id
        AND Classes.period = 1
  );

INSERT INTO Students (
    name,
    email,
    nfcTagId,
    currentLocation,
    currentClass
)
SELECT
    'Alex Student',
    'alex.student@example.com',
    'NFC-SAMPLE-001',
    'B12',
    Classes.id
FROM Classes
JOIN Teachers ON Teachers.id = Classes.teacherId
WHERE Teachers.email = 'teacher@example.com'
  AND Classes.className = 'Year 10 Computing'
  AND Classes.period = 1
  AND NOT EXISTS (
      SELECT 1
      FROM Students
      WHERE Students.nfcTagId = 'NFC-SAMPLE-001'
         OR Students.email = 'alex.student@example.com'
  );

INSERT INTO Timetable (studentId, classId, period)
SELECT Students.id, Classes.id, 1
FROM Students
JOIN Classes ON Classes.id = Students.currentClass
WHERE Students.nfcTagId = 'NFC-SAMPLE-001'
  AND NOT EXISTS (
      SELECT 1
      FROM Timetable
      WHERE Timetable.studentId = Students.id
        AND Timetable.classId = Classes.id
        AND Timetable.period = 1
  );

INSERT INTO RollEntries (studentId, classId, timestamp, status, source)
SELECT
    Students.id,
    Classes.id,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    'present',
    'sample'
FROM Students
JOIN Classes ON Classes.id = Students.currentClass
WHERE Students.nfcTagId = 'NFC-SAMPLE-001'
  AND NOT EXISTS (
      SELECT 1
      FROM RollEntries
      WHERE RollEntries.studentId = Students.id
        AND RollEntries.classId = Classes.id
        AND RollEntries.source = 'sample'
  );

COMMIT;
