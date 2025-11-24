const express = require('express');
const Song = require('../models/Song');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth-jwt');
const { requireArtist } = require('../middleware/artistAuth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, genre, limit = 20, page = 1 } = req.query;
    const query = { status: 'published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
        { album: { $regex: search, $options: 'i' } }
      ];
    }

    if (genre) {
      query.genre = genre;
    }

    const songs = await Song.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ playCount: -1 })
      .populate('createdBy', 'username');

    const total = await Song.countDocuments(query);

    res.json({
      songs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter required' });
    }

    const songs = await Song.find({
      status: 'published',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { artist: { $regex: q, $options: 'i' } }
      ]
    }).populate('createdBy', 'username');

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const songs = await Song.find({ status: 'published' })
      .sort({ playCount: -1, likes: -1 })
      .limit(20)
      .populate('createdBy', 'username');
    res.json(songs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('createdBy', 'username');
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/play', authenticateToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    song.playCount += 1;
    await song.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        recentlyPlayed: {
          song: song._id,
          playedAt: new Date()
        }
      }
    });

    res.json({ message: 'Song played', playCount: song.playCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const isLiked = user.likedSongs.includes(song._id);

    if (isLiked) {
      user.likedSongs.pull(song._id);
      song.likes = Math.max(0, song.likes - 1);
    } else {
      user.likedSongs.push(song._id);
      song.likes += 1;
    }

    await user.save();
    await song.save();

    res.json({ 
      liked: !isLiked, 
      likes: song.likes,
      likedSongs: user.likedSongs 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    user.likedSongs.pull(song._id);
    song.likes = Math.max(0, song.likes - 1);

    await user.save();
    await song.save();

    res.json({ 
      liked: false, 
      likes: song.likes,
      message: 'Song unliked successfully'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/', authenticateToken, requireArtist, async (req, res) => {
  try {
    const { title, artist, duration, genre, coverArt, fileUrl } = req.body;

    const song = await Song.create({
      title,
      artist,
      duration,
      genre,
      coverArt,
      fileUrl,
      createdBy: req.user.id
    });

    const populatedSong = await Song.findById(song._id).populate('createdBy', 'username');

    res.status(201).json({ song: populatedSong });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/my-songs', authenticateToken, requireArtist, async (req, res) => {
  try {
    const songs = await Song.find({ createdBy: req.user.id }).populate('createdBy', 'username');
    res.json({ songs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, requireArtist, async (req, res) => {
  try {
    const song = await Song.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    res.json({ song: updatedSong });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, requireArtist, async (req, res) => {
  try {
    const song = await Song.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;