# Student guide: add users and connect an NFC tag

This guide sets up one teacher, one class, and one student. The student's NFC
tag ID is stored on their database account. When the reader sends that same ID
to the backend, the backend creates a `present` roll entry automatically.

## 1. Prepare the database

Open any terminal in the project folder (for example VS Code Terminal, Windows
Terminal, Command Prompt, Git Bash, or macOS/Linux Terminal), then run:

```powershell
cd backend
npm install
npm run db:setup
npm run db:verify
```

The last command should report `Database verification passed` and show the
included sample entry.

## 2. Add a teacher

Run the command below, replacing the example details with your teacher's name,
email, and password:

```powershell
npm run teacher:add -- "Ms Taylor" "ms.taylor@example.com" "ClassPass123"
```

The command hashes the password before it is stored. It prints the new teacher
ID. Never add a plain-text password directly to the `Teachers` table.

## 3. Add a class for the teacher

Use the same teacher email. The last two values are the room and period:

```powershell
npm run class:add -- "Year 9 Digital Tech" "ms.taylor@example.com" "C04" 1
```

Write down the class ID printed by the command. You will use it when adding the
student.

## 4. Read the NFC tag ID

1. Connect the NFC reader and run its normal tag-reading sketch or program.
2. Hold the student's card or tag against the reader.
3. Copy the UID exactly as the reader reports it, for example `04A1B2C3D4`.
4. Use one tag per student. The database rejects a UID already assigned to
   somebody else.

The tag only needs to supply its UID. Do not write the student's name, email, or
other personal data onto the tag.

## 5. Add the student and link the NFC tag

Replace `2` below with the class ID printed in step 3, and replace the example
UID with the exact UID from the reader:

```powershell
npm run student:add -- "Jamie Lee" "jamie.lee@example.com" "04A1B2C3D4" 2
```

This single command:

1. creates the student account;
2. saves the UID in `Students.nfcTagId`;
3. sets the student's current class; and
4. creates the linked timetable row.

## 6. Start the backend

```powershell
npm start
```

Leave this PowerShell window running. By default, the API is available at
`http://localhost:3000`.

## 7. Test the teacher login

Open a second terminal window in `backend`. In PowerShell, run:

```powershell
$loginBody = @{ email = "ms.taylor@example.com"; password = "ClassPass123" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body $loginBody
```

In Command Prompt, Git Bash, or a macOS/Linux terminal with `curl`, run:

```sh
curl -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" -d "{\email\:\ms.taylor@example.com\,\password\:\ClassPass123\}"
```

A successful response contains a `token`.

## 8. Test an NFC tap

Use the UID assigned in step 5:

In PowerShell:

```powershell
$tapBody = @{ tagId = "04A1B2C3D4" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/nfc/tap" -ContentType "application/json" -Body $tapBody
```

In another terminal with `curl`:

```sh
curl -X POST "http://localhost:3000/api/nfc/tap" -H "Content-Type: application/json" -d "{\tagId\:\04A1B2C3D4\}"
```

A successful response welcomes the student. The backend also inserts a new row
in `RollEntries` with status `present` and source `NFC`.

For a real reader, configure its software to send the same HTTP request whenever
it detects a tag:

```text
POST /api/nfc/tap
Content-Type: application/json

{"tagId":"04A1B2C3D4"}
```

The `tagId` text must match `Students.nfcTagId` exactly.

## 9. Check the class roll

Replace `2` with the class ID from step 3:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/roll/2"
```

Or in any terminal with `curl`:

```sh
curl "http://localhost:3000/api/roll/2"
```

The newest tap should appear first. You can also open `backend/database.sqlite`
in DB Browser for SQLite and inspect `Teachers`, `Students`, `Classes`,
`Timetable`, and `RollEntries`.

## Common errors

- `Unknown NFC tag`: the reader's UID does not exactly match the stored value.
- `NFC tag is already linked`: that UID belongs to another student.
- `Teacher not found`: add the teacher first or check the email spelling.
- `Class not found`: use the numeric class ID printed by `class:add`.
- Connection refused: start the backend with `npm start` and keep it running.

### Git cannot unlink `backend/database.sqlite`

This means the backend or DB Browser still has the database open. Stop the
backend with Ctrl+C, close DB Browser for SQLite, and run `git pull` again. If it
is still locked, restart the computer and pull before reopening either program.

The live database is deliberately ignored by Git. If it does not exist after a
clone or pull, open a terminal in `backend` and run:

```sh
npm run db:setup
```

If your local attendance data matters, copy `backend/database.sqlite` somewhere
outside the project before pulling, then copy it back afterward.

For a classroom prototype, a UID is convenient. For a real security-sensitive
system, remember that basic NFC UIDs can be copied; use secure cards and an
authenticated reader-to-server connection.
