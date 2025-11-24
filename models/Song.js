const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  album: {
    type: String
  },
  duration: {
    type: Number,
    required: true
  },
  genre: {
    type: String
  },
  albumArt: {
    type: String
  },
  audioFile: {
    type: String
  },
  fileUrl: {
    type: String
  },
  coverArt: {
    type: String
  },
  playCount: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Song', songSchema);