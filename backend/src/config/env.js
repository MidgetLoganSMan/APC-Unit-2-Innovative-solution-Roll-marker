import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../..', import.meta.url));

// Resolve configuration relative to the backend, regardless of launch directory.
dotenv.config({
  path: path.join(backendDirectory, '.env')
});

const requiredVars = ['JWT_SECRET', 'DB_FILE', 'PORT'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error('Missing required environment variable: ' + key);
  }
});

const config = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  dbFile: path.resolve(backendDirectory, process.env.DB_FILE)
};

export default config;
