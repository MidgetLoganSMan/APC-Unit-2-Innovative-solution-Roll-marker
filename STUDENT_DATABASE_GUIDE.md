# Student accounts, NFC cards, and attendance

The teacher app can now link an existing student account to an NFC card. Once
linked, tapping that card changes the student's status for the current day to
`present` and shows the update on the live class roll.

## Start the application

In one terminal:

```powershell
cd backend
npm install
npm run db:setup
npm start
```

In a second terminal:

```powershell
cd frontend/teacher-app
npm install
npm run dev
```

Open the address printed by Vite. The included sample login is:

- Email: `teacher@example.com`
- Password: `password123`

## Add a student account

Find the class ID by opening the database in DB Browser or by using the class ID
returned by `npm run class:add`. A card does not need to be available when the
account is created:

```powershell
cd backend
npm run student:add -- "Jamie Lee" "jamie.lee@example.com" 2
```

The older one-step form still works when the card UID is already known:

```powershell
npm run student:add -- "Jamie Lee" "jamie.lee@example.com" "04A1B2C3D4" 2
```

Each student must belong to one of the signed-in teacher's classes before that
teacher can link a card to the account.

## Link a card in the teacher app

1. Sign in and choose the class.
2. Find a student whose card state says **No card**.
3. Select **Link card**.
4. Tap the student's card while the scan box is focused. A keyboard-style USB
   reader will type the UID and submit it when it sends Enter.
5. If the reader is a serial device, select **Connect USB serial reader**, choose
   the connected device, and tap the card. Serial readers must send one UID per
   line at 9600 baud.
6. On a supported mobile browser, **Connect Web NFC** can use the device's NFC
   hardware directly.

The UID is normalized before storage, and one UID cannot be assigned to two
students. Select **Unlink** if the card needs to be reassigned.

## Mark attendance with a card

Leave the scan box focused and tap a linked card. The backend finds the student,
updates today's roll entry to `present`, records `NFC` as the source, and returns
the student's name. The class roll refreshes immediately and also polls every
three seconds for taps received by another reader process.

Repeated taps on the same day update the existing entry rather than adding
duplicates. At the start of a new day, students display as absent until they are
marked again.

## Connect a reader bridge

A PC/SC reader or microcontroller with its own vendor software can use the HTTP
interface. Configure the bridge to send the detected UID to:

```text
POST http://localhost:3000/api/nfc/tap
Content-Type: application/json

{"tagId":"04A1B2C3D4"}
```

PowerShell test:

```powershell
$tap = @{ tagId = "04A1B2C3D4" } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/nfc/tap" `
  -ContentType "application/json" `
  -Body $tap
```

The web page supports keyboard-emulating, Web Serial, and Web NFC readers. A
vendor-specific PC/SC reader that exposes none of those interfaces needs a small
local bridge that calls this endpoint.

## API summary

Teacher-authenticated endpoints:

- `GET /api/roll/classes` — list the signed-in teacher's classes.
- `GET /api/roll/:classId` — get today's roster and current status.
- `PUT /api/student/:studentId/nfc` with `{"tagId":"..."}` — link a card.
- `DELETE /api/student/:studentId/nfc` — unlink a card.
- `PUT /api/roll/:classId/students/:studentId` with `{"status":"present"}`
  — manually update attendance.

Reader endpoint:

- `POST /api/nfc/tap` with `{"tagId":"..."}` — mark the linked student present.

## Common errors

- `Unknown NFC tag`: no student account is linked to that UID.
- `That NFC card is already linked`: unlink it from the other student first.
- `Student not found`: the account is not in a class owned by the signed-in
  teacher.
- Connection refused: start the backend and leave it running.
- Reader not shown: confirm its Windows driver and determine whether it exposes
  keyboard, serial, Web NFC, or vendor/PC-SC access.

For this classroom prototype, the card stores no personal details; only its UID
is saved on the student record. Basic NFC UIDs can be copied, so a production
system should also authenticate its reader bridge and use secure cards.
