const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/users', require('./routes/users'));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
  app.get('/', (req, res) => {
  res.json({ 
    message: 'Zuno/Streamly Backend API',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      songs: '/api/songs', 
      playlists: '/api/playlists',
      users: '/api/users'
    }
  });
});