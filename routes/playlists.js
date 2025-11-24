const express = require('express');
const mongoose = require('mongoose');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const { authenticateToken } = require('../middleware/auth-jwt');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id })
      .populate('songs')
      .sort({ createdAt: -1 });
    res.json({ playlists });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      owner: req.user.id 
    }).populate('songs');

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.json({ playlist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, isPublic = true } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user.id,
      isPublic
    });

    res.status(201).json({ playlist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name, description, isPublic },
      { new: true, runValidators: true }
    );

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.json({ playlist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ 
      _id: req.params.id, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/songs', async (req, res) => {
  try {
    const { songId } = req.body;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: 'Song already in playlist' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlist._id).populate('songs');

    res.json({ playlist: updatedPlaylist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    playlist.songs.pull(req.params.songId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlist._id).populate('songs');

    res.json({ playlist: updatedPlaylist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/play', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    playlist.playCount += 1;
    await playlist.save();

    res.json({ message: 'Playlist played', playCount: playlist.playCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;