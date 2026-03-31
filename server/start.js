const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Movie Ticket Booking API' });
});

app.get('/api/movies', async (req, res) => {
  try {
    const Movie = require('./models/Movie');
    const movies = await Movie.find({ isActive: true });
    res.json(movies);
  } catch (error) {
    res.json([
      {
        id: 1,
        title: "Avengers: Endgame",
        description: "After the devastating events of Infinity War",
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg",
        rating: 8.4,
        genre: ["Action", "Adventure"]
      }
    ]);
  }
});

// Find available port
const net = require('net');

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.close();
        findAvailablePort(startPort + 1).then(resolve);
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      const port = server.address().port;
      server.close();
      resolve(port);
    });
    
    server.listen(startPort);
  });
}

// Start server on available port
findAvailablePort(5000)
  .then(port => {
    app.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`);
      console.log(`📚 API Base URL: http://localhost:${port}/api`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
  });