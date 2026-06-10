const mongoose = require('mongoose');

const intervenantSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String },
    telephone: { type: String },
    specialite: { type: String },
    actif: { type: Boolean, default: true }
});

module.exports = mongoose.model('Intervenant', intervenantSchema);