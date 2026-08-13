import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
 const token = req.headers.authorization?.split(" ")[1];
 if (!token) return res.status(401).json({ error: "Missing token" });

 try {
 const decoded = jwt.verify(token, "secretkey");
 req.user = decoded;
 next();
 } catch {
 res.status(401).json({ error: "Invalid token" });
 }
}