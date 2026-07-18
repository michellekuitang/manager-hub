const mongoose = require('mongoose');

const intervenantSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String },
    telephone: { type: String }, // <-- Ajouté ici pour autoriser l'enregistrement !
    role: { type: String },
    marque_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque' },
    actif: { type: Boolean, default: true }
});

module.exports = mongoose.model('Intervenant', intervenantSchema);