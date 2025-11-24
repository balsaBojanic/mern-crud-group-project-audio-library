const User = require('../models/User');

const requireArtist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'artist') {
      return res.status(403).json({ message: 'Artist access required' });
    }

    req.artist = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requireArtist };