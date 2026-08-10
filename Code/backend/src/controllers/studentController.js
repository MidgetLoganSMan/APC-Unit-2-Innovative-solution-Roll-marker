import studentService from "../services/studentService.js";

const studentController = {
  async search(req, res) {
    try {
      const { name } = req.query;
      const student = await studentService.searchStudent(name);
      res.json(student);
    } catch (err) {
      res.status(404).json({ error: "Student not found" });
    }
  }
};

export default studentController;
