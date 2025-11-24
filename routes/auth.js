const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth-jwt');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, username, role = 'listener' } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    const user = await User.create({ email, password, username, role });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
      likedSongs: req.user.likedSongs,
      recentlyPlayed: req.user.recentlyPlayed
    }
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;