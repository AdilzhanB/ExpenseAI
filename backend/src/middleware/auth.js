import jwt from 'jsonwebtoken';
import database from '../database/init.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token is required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    try {
      // Verify user still exists
      const user = await database.get(
        'SELECT id, email, name, avatar_url FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (!user) {
        return res.status(403).json({ 
          success: false, 
          message: 'User no longer exists' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const user = await database.get(
        'SELECT id, email, name, avatar_url FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      req.user = user || null;
      next();
    } catch (error) {
      req.user = null;
      next();
    }
  });
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
}
