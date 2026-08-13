import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

// Required environment variables
const requiredVars = [
  "JWT_SECRET",
  "DB_FILE",
  "PORT"
];

// Validate required variables
requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Export config object
const config = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  dbFile: process.env.DB_FILE
};

export default config;
