const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['listener', 'artist'],
    default: 'listener'
  },
  likedSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  recentlyPlayed: [{
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    },
    playedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);