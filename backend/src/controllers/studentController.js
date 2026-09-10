import studentService from '../services/StudentService.js';
// Controller for handling student-related requests
const studentController = {
  async search(req, res, next) {
    try {
      const { name } = req.query;
      const student = await studentService.searchStudent(name, req.user.id);
      res.json(student);
    } catch (err) {
      next(err);
    }
  },

  async linkNfcTag(req, res, next) {
    try {
      const student = await studentService.linkNfcTag(
        req.params.studentId,
        req.body.tagId,
        req.user.id
      );
      res.json(student);
    } catch (err) {
      next(err);
    }
  },

  async unlinkNfcTag(req, res, next) {
    try {
      const student = await studentService.unlinkNfcTag(
        req.params.studentId,
        req.user.id
      );
      res.json(student);
    } catch (err) {
      next(err);
    }
  }
};

export default studentController;
