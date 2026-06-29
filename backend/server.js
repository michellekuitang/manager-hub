const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// ===== IMPORTS ROUTES =====
const authRoutes = require('./routes/auth');
const tournageRoutes = require('./routes/tournages');
const contenuRoutes = require('./routes/contenus');
const campagneRoutes = require('./routes/campagnes');
const marqueRoutes = require('./routes/marques');
const intervenantRoutes = require('./routes/intervenants');
const iaRoutes = require('./routes/ia');
const equipeRoutes = require('./routes/equipe');

const app = express();

// ===== MIDDLEWARES GLOBAUX =====
// (Toujours déclarer CORS et JSON en tout premier)
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ===== CONNEXION MONGODB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur MongoDB :', err));

// ===== DECLARATION DES ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/tournages', tournageRoutes);
app.use('/api/contenus', contenuRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/marques', marqueRoutes);
app.use('/api/intervenants', intervenantRoutes); 
app.use('/api/ia', iaRoutes);
app.use('/api/equipe', equipeRoutes); // <--- Ta route d'équipe est maintenant parfaitement enregistrée après le parseur JSON

// ===== DÉMARRAGE =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});