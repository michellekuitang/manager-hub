const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const tournageRoutes = require('./routes/tournages');
const contenuRoutes = require('./routes/contenus');
const campagneRoutes = require('./routes/campagnes');
const marqueRoutes = require('./routes/marques');
const intervenantRoutes = require('./routes/intervenants');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARES =====
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/auth', authRoutes);

// ===== CONNEXION MONGODB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur MongoDB :', err));

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/tournages', tournageRoutes);
app.use('/api/contenus', contenuRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/marques', marqueRoutes);
app.use('/api/intervenants', intervenantRoutes);
// ===== DÉMARRAGE =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});