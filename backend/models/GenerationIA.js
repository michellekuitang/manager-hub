const mongoose = require('mongoose');

const generationIASchema = new mongoose.Schema({
    utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    marque_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque', required: true },
    pilier: { type: String },
    type_contenu: { type: String },
    objectif: { type: String },
    ton: { type: String },
    contexte: { type: String },
    resultat: { type: String },
    date_generation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GenerationIA', generationIASchema);