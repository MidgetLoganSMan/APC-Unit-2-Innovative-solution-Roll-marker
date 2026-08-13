import authService from "../services/authService.js";

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const token = await authService.login(email, password);
      res.json({ token });
    } catch (err) {
      res.status(401).json({ error: "Invalid credentials" });
    }
  }
};

export default authController;
