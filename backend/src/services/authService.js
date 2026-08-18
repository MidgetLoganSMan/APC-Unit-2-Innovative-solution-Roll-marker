import { connectDB } from '../config/db.js';
import config from '../config/env.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const authService = {
  async login(email, password) {
    const db = await connectDB();
    const teacher = await db.get(
      'SELECT * FROM Teachers WHERE email = ?',
      email
    );

    if (!teacher) throw new Error('Invalid credentials');

    const match = await bcrypt.compare(password, teacher.passwordHash);
    if (!match) throw new Error('Invalid credentials');

    return jwt.sign({ id: teacher.id }, config.jwtSecret, { expiresIn: '8h' });
  }
};

export default authService;
