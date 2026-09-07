import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'roll-marker-'));
process.env.PORT = '0';
process.env.JWT_SECRET = 'test-only-secret';
process.env.DB_FILE = path.join(temporaryDirectory, 'test.sqlite');

const { closeDB, initializeDB } = await import('../src/config/db.js');
const { default: app } = await import('../src/app.js');

let server;
let baseUrl;
let db;
let token;
let classId;
let studentId;
let sampleStudentId;

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  db = await initializeDB();
  const selectedClass = await db.get(
    `SELECT Classes.id
     FROM Classes
     JOIN Teachers ON Teachers.id = Classes.teacherId
     WHERE Teachers.email = 'teacher@example.com'`
  );
  classId = selectedClass.id;

  const inserted = await db.run(
    `INSERT INTO Students (name, email, nfcTagId, currentClass)
     VALUES ('Jamie Test', 'jamie.test@example.com', NULL, ?)`,
    classId
  );
  studentId = inserted.lastID;
  await db.run(
    'INSERT INTO Timetable (studentId, classId, period) VALUES (?, ?, 1)',
    studentId,
    classId
  );
  sampleStudentId = (await db.get(
    "SELECT id FROM Students WHERE nfcTagId = 'NFC-SAMPLE-001'"
  )).id;

  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'teacher@example.com',
      password: 'password123'
    })
  });
  assert.equal(login.response.status, 200);
  token = login.body.token;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await closeDB();
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test('a teacher links a card and its tap changes the student to present', async () => {
  const authorization = { Authorization: `Bearer ${token}` };
  const initialRoll = await request(`/roll/${classId}`, { headers: authorization });

  assert.equal(initialRoll.response.status, 200);
  const initialStudent = initialRoll.body.students.find(
    (student) => student.studentId === studentId
  );
  assert.equal(initialStudent.nfcLinked, false);
  assert.equal(initialStudent.status, 'absent');

  const linked = await request(`/student/${studentId}/nfc`, {
    method: 'PUT',
    headers: authorization,
    body: JSON.stringify({ tagId: '04:a1 b2' })
  });
  assert.equal(linked.response.status, 200);
  assert.equal(linked.body.nfcTagId, '04A1B2');

  const duplicateLink = await request(`/student/${sampleStudentId}/nfc`, {
    method: 'PUT',
    headers: authorization,
    body: JSON.stringify({ tagId: '04A1B2' })
  });
  assert.equal(duplicateLink.response.status, 409);

  const tap = await request('/nfc/tap', {
    method: 'POST',
    body: JSON.stringify({ tagId: 'UID: 04 A1 B2' })
  });
  assert.equal(tap.response.status, 200);
  assert.equal(tap.body.student.id, studentId);
  assert.equal(tap.body.attendance.status, 'present');

  const markedAbsent = await request(`/roll/${classId}/students/${studentId}`, {
    method: 'PUT',
    headers: authorization,
    body: JSON.stringify({ status: 'absent' })
  });
  assert.equal(markedAbsent.response.status, 200);

  const secondTap = await request('/nfc/tap', {
    method: 'POST',
    body: JSON.stringify({ tagId: '04A1B2' })
  });
  assert.equal(secondTap.response.status, 200);
  assert.equal(secondTap.body.attendance.entryId, tap.body.attendance.entryId);

  const rapidTaps = await Promise.all([
    request('/nfc/tap', {
      method: 'POST',
      body: JSON.stringify({ tagId: '04A1B2' })
    }),
    request('/nfc/tap', {
      method: 'POST',
      body: JSON.stringify({ tagId: '04A1B2' })
    })
  ]);
  assert.ok(rapidTaps.every(({ response }) => response.status === 200));

  const updatedRoll = await request(`/roll/${classId}`, { headers: authorization });
  const updatedStudent = updatedRoll.body.students.find(
    (student) => student.studentId === studentId
  );
  assert.equal(updatedStudent.status, 'present');
  assert.equal(updatedStudent.source, 'NFC');

  const entryCount = await db.get(
    'SELECT COUNT(*) AS count FROM RollEntries WHERE studentId = ? AND classId = ?',
    studentId,
    classId
  );
  assert.equal(entryCount.count, 1);
});

test('linking requires authentication and unknown cards return not found', async () => {
  const noAuthentication = await request(`/student/${studentId}/nfc`, {
    method: 'DELETE'
  });
  assert.equal(noAuthentication.response.status, 401);

  const unknownTap = await request('/nfc/tap', {
    method: 'POST',
    body: JSON.stringify({ tagId: 'DOES-NOT-EXIST' })
  });
  assert.equal(unknownTap.response.status, 404);
  assert.equal(unknownTap.body.error, 'Unknown NFC tag');
});
