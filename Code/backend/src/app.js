import express from "express";
import cors from "cors";
import nfcRoutes from "./routes/nfcRoutes.js";
import rollRoutes from "./routes/rollRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/nfc", nfcRoutes);
app.use("/api/roll", rollRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/auth", authRoutes);

// Error handler
app.use(errorHandler);

export default app;
