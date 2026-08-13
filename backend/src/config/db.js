import sqlite3 from "sqlite3";
import { open } from "sqlite";
import config from "./env.js";

export async function connectDB() {
 return open({
 filename: config.dbFile,
 driver: sqlite3.Database
  });
}