import rollService from '../services/RollService.js';

const rollController = {
  async getClasses(req, res, next) {
    try {
      const classes = await rollService.getTeacherClasses(req.user.id);
      res.json(classes);
    } catch (err) {
      next(err);
    }
  },

  async updateRoll(req, res, next) {
    try {
      const { entryId, newStatus } = req.body;
      const result = await rollService.updateRoll(entryId, newStatus, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateStudentStatus(req, res, next) {
    try {
      const result = await rollService.updateStudentStatus(
        req.params.classId,
        req.params.studentId,
        req.body.status,
        req.user.id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getClassRoll(req, res, next) {
    try {
      const { classId } = req.params;
      const roll = await rollService.getClassRoll(classId, req.user.id);
      res.json(roll);
    } catch (err) {
      next(err);
    }
  }
};

export default rollController;
