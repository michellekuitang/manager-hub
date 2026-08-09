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
const templateRoutes = require('./routes/templates');
const creneauRoutes = require('./routes/creneaux');
const rapportRoutes = require('./routes/rapport');

const app = express();

// ===== CONFIGURATION CORS =====
// Seules les origines listees dans CORS_ORIGINS peuvent appeler l'API depuis
// un navigateur. En developpement, la valeur par defaut autorise le serveur
// React local. En production, on renseigne l'adresse du frontend deploye.
//
// Exemple de variable d'environnement sur l'hebergeur :
//   CORS_ORIGINS=https://manager-hub.onrender.com
// Plusieurs origines se separent par des virgules.
const ORIGINES_AUTORISEES = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origine) => origine.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origine, callback) => {
        // Les requetes sans origine (Postman, applications mobiles, tests)
        // ne sont pas soumises a la politique CORS des navigateurs.
        if (!origine) return callback(null, true);

        if (ORIGINES_AUTORISEES.includes(origine)) {
            return callback(null, true);
        }
        return callback(new Error(`Origine non autorisee : ${origine}`));
    },
    credentials: true
}));

// ===== MIDDLEWARES GLOBAUX =====
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ===== ROUTE DE SANTE =====
// Permet a l'hebergeur et a soi-meme de verifier que le service repond et
// que la base est bien connectee, sans avoir a s'authentifier.
app.get('/api/sante', (req, res) => {
    const etatsMongo = ['deconnecte', 'connecte', 'connexion en cours', 'deconnexion en cours'];
    res.status(200).json({
        service: 'Manager Hub API',
        statut: 'en ligne',
        base_de_donnees: etatsMongo[mongoose.connection.readyState] || 'inconnu',
        horodatage: new Date().toISOString()
    });
});

// ===== DECLARATION DES ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/tournages', tournageRoutes);
app.use('/api/contenus', contenuRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/marques', marqueRoutes);
app.use('/api/intervenants', intervenantRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/creneaux', creneauRoutes);
app.use('/api/rapports', rapportRoutes);

// ===== GESTION DES ROUTES INCONNUES =====
app.use((req, res) => {
    res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// ===== GESTION CENTRALISEE DES ERREURS =====
// Notamment les rejets CORS, qui doivent renvoyer un message clair plutot
// qu'une erreur 500 opaque.
app.use((err, req, res, next) => {
    if (err.message && err.message.startsWith('Origine non autorisee')) {
        return res.status(403).json({ message: err.message });
    }
    console.error('Erreur non geree :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
});

// ===== DEMARRAGE =====
const PORT = process.env.PORT || 5000;

// La connexion a la base conditionne le demarrage du serveur : un service
// "en ligne" mais sans base repondrait des erreurs 500 a chaque requete, ce
// qui est bien plus difficile a diagnostiquer qu'un demarrage refuse.
const demarrer = async () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI absent. Le serveur ne peut pas demarrer.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecte a MongoDB');
    } catch (err) {
        console.error('Impossible de se connecter a MongoDB :', err.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Serveur demarre sur le port ${PORT}`);
        console.log(`Origines autorisees : ${ORIGINES_AUTORISEES.join(', ')}`);
    });
};

demarrer();

module.exports = app;