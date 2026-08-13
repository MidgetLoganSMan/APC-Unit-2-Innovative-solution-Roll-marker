import nfcService from "../services/nfcService.js";

const nfcController = {
  async handleTap(req, res) {
    try {
      const { tagId } = req.body;
      const result = await nfcService.processTap(tagId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export default nfcController;
