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

The live `backend/database.sqlite` file is local and is not tracked by Git. This
prevents a running backend or DB Browser from blocking `git pull`. After cloning
or if the file is missing, recreate it with `npm run db:setup` from `backend`.
