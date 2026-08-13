import rollService from "../services/rollService.js";

const rollController = {
  async updateRoll(req, res) {
    try {
      const { entryId, newStatus } = req.body;
      const result = await rollService.updateRoll(entryId, newStatus);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getClassRoll(req, res) {
    try {
      const { classId } = req.params;
      const roll = await rollService.getClassRoll(classId);
      res.json(roll);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export default rollController;
