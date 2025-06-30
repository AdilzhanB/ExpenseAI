import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import database from '../database/init.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    throw new AppError('All fields are required', 400);
  }

  if (!validator.isEmail(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  if (name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters', 400);
  }

  // Check if user already exists
  const existingUser = await database.get(
    'SELECT id FROM users WHERE email = ?',
    [email.toLowerCase()]
  );

  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await database.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email.toLowerCase(), hashedPassword, name.trim()]
  );

  // Generate JWT
  const token = jwt.sign(
    { userId: result.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Get user data (without password)
  const user = await database.get(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?',
    [result.id]
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  if (!validator.isEmail(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  // Find user
  const user = await database.get(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase()]
  );

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Remove password from response
  delete user.password;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token is required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await database.get(
      'SELECT id, email, name, avatar_url, preferences, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Parse preferences
    user.preferences = user.preferences ? JSON.parse(user.preferences) : {};

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
}));

// Update profile
router.put('/profile', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token is required', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const { name, preferences } = req.body;

  // Validation
  if (name && name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters', 400);
  }

  // Build update query
  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name.trim());
  }

  if (preferences) {
    updates.push('preferences = ?');
    values.push(JSON.stringify(preferences));
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(decoded.userId);

  await database.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // Get updated user
  const user = await database.get(
    'SELECT id, email, name, avatar_url, preferences, created_at, updated_at FROM users WHERE id = ?',
    [decoded.userId]
  );

  user.preferences = user.preferences ? JSON.parse(user.preferences) : {};

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// Change password
router.put('/password', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token is required', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  // Get current user
  const user = await database.get(
    'SELECT password FROM users WHERE id = ?',
    [decoded.userId]
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await database.run(
    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hashedPassword, decoded.userId]
  );

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token is required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Generate new token
    const newToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
}));

export default router;
