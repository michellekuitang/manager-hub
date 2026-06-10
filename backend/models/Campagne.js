const mongoose = require('mongoose');

const campagneSchema = new mongoose.Schema({
    marque_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque', required: true },
    nom: { type: String, required: true },
    budget: { type: Number },
    date_debut: { type: Date },
    date_fin: { type: Date },
    objectif_leads: { type: Number },
    leads_actuels: { type: Number, default: 0 },
    statut: { type: String, enum: ['Active', 'Terminee', 'A venir'], default: 'A venir' }
});

module.exports = mongoose.model('Campagne', campagneSchema);