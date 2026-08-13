import { connectDB } from "../config/db.js";

const rollService = {
 async updateRoll(entryId, newStatus) {
 const db = await connectDB();
 await db.run(
 "UPDATE RollEntries SET status = ? WHERE id = ?",
 newStatus,
 entryId
 );
 return { success: true };
 },

 async getClassRoll(classId) {
 const db = await connectDB();
 return db.all(
 "SELECT * FROM RollEntries WHERE classId = ? ORDER BY timestamp DESC",
 classId
 );
 }
};

export default rollService;