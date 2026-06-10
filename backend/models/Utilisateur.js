const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mot_de_passe_hash: { type: String, required: true },
    role: { type: String, default: 'user' }
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('Utilisateur', utilisateurSchema);