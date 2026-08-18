import bcrypt from 'bcrypt';
import { closeDB, initializeDB } from '../src/config/db.js';

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: npm run teacher:add -- <name> <email> <password>');
  process.exitCode = 1;
} else {
  try {
    const db = await initializeDB();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO Teachers (name, email, passwordHash) VALUES (?, ?, ?)',
      name.trim(),
      email.trim().toLowerCase(),
      passwordHash
    );

    console.log('Teacher added with ID ' + result.lastID + ': ' + name);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.error('A teacher with that email already exists.');
    } else {
      console.error('Could not add teacher:', error);
    }
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}
