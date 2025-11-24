const express = require('express');
const User = require('../models/User');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const { authenticateToken } = require('../middleware/auth-jwt');

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('likedSongs')
      .populate('recentlyPlayed.song');

    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/recently-played', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('recentlyPlayed.song')
      .select('recentlyPlayed');

    const recentlyPlayed = user.recentlyPlayed
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt))
      .slice(0, 20)
      .map(item => item.song);

    res.json({ songs: recentlyPlayed });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/likes', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('likedSongs')
      .select('likedSongs');

    res.json({ songs: user.likedSongs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/liked-songs', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('likedSongs')
      .select('likedSongs');

    res.json({ songs: user.likedSongs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/artist/:id', async (req, res) => {
  try {
    const artist = await User.findById(req.params.id).select('-password -email');
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const songs = await Song.find({ 
      createdBy: req.params.id,
      status: 'published' 
    }).sort({ playCount: -1 });

    const playlists = await Playlist.find({
      owner: req.params.id,
      isPublic: true
    }).populate('songs');

    res.json({
      artist,
      songs,
      playlists,
      stats: {
        totalSongs: songs.length,
        totalPlays: songs.reduce((sum, song) => sum + song.playCount, 0),
        totalLikes: songs.reduce((sum, song) => sum + song.likes, 0)
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;