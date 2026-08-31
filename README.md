# APC Unit 2 Innovative Solution: Roll Marker

## Backend database

From the `backend` directory:

```powershell
npm run db:setup
npm run db:verify
npm start
```

Database setup is safe to run more than once. It creates the schema and a linked
sample teacher, class, student, timetable record, and roll entry.

- Teacher login: `teacher@example.com` / `password123`
- Sample student: `Alex Student`
- Sample NFC tag: `NFC-SAMPLE-001`

See [the student database and NFC guide](STUDENT_DATABASE_GUIDE.md) for the full
teacher, class, student, NFC-linking, and attendance-testing workflow.

The proof-of-concept `backend/database.sqlite` file is tracked by Git so the
group can work with the same sample data. SQLite journal, shared-memory, and WAL
files remain ignored because they are temporary runtime files.

Before pulling or switching branches, stop the backend and close DB Browser.
Avoid making database changes on multiple branches at the same time because a
SQLite database is a binary file and Git cannot merge conflicting changes.
