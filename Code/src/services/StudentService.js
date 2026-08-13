import { connectDB } from "../config/db.js";

const studentService = {
 async searchStudent(name) {
 const db = await connectDB();
 const student = await db.get(
 "SELECT * FROM Students WHERE name LIKE ?",
 `%${name}%`
    );
 if (!student) throw new Error("Student not found");
 return student;
 }
};

export default studentService;