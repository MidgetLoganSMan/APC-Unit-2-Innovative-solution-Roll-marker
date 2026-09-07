import nfcService from "../services/nfcService.js";

const nfcController = {
  async handleTap(req, res, next) {
    try {
      const { tagId } = req.body;
      const result = await nfcService.processTap(tagId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default nfcController;
