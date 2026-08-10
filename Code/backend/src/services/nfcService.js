import { connectDB } from "../config/db.js";
import timeUtils from "../utils/time.js";

const nfcService = {
 async processTap(tagId) {
 const db = await connectDB();

 const student = await db.get(
 "SELECT * FROM Students WHERE nfcTagId = ?",
 tagId
 );

 if (!student) throw new Error("Unknown NFC tag");

 const period = timeUtils.getCurrentPeriod();

 await db.run(
 "INSERT INTO RollEntries (studentId, classId, timestamp, status, source) VALUES (?, ?, ?, ?, ?)",
 student.id,
 student.currentClass,
 Date.now(),
 "present",
 "NFC"
    );

 return {
 message: `Welcome ${student.name}`,
 student
 };
 }
};

export default nfcService;