require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./Routes/User');
const bookRoutes = require('./Routes/Book');
const path = require('path');

const app = express(); // Declare app before using it



const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', // ou l'URL de ton frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));


// Middleware to parse incoming JSON requests
app.use(express.json());


// Routes for user authentication and books
app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.log('Connexion à MongoDB échouée !', error));

module.exports = app;
