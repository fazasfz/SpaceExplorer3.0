require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Route Registry
app.use('/api/auth', require('./routes/auth'));
app.use('/api/observations', require('./routes/observation'));
app.use('/api/launches', require('./routes/launch'));
app.use('/api/citizen', require('./routes/citizen'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/discoveries', require('./routes/discovery'));
app.use('/api/crew', require('./routes/crew'));   // Community Directory

app.get('/', (req, res) => res.send('🌌 SpaceExplorer 3.0 — Amateur Astronomy & Citizen Science API'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔭 SpaceExplorer server running on port ${PORT}`));