const mongoose = require('mongoose');

const campagneSchema = new mongoose.Schema({
    marque_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque', required: true },
    nom: { type: String, required: true },
    type: { type: String, default: 'Google Ads' }, // Google Ads, Facebook Ads, TikTok Ads, etc.
    statut: { type: String, enum: ['Active', 'Terminée', 'A venir', 'Brouillon'], default: 'Brouillon' },
    campus: { type: String, default: 'Tous' },
    budget: { type: Number, default: 0 },
    depense: { type: Number, default: 0 }, // Pour le calcul du CPL
    leads: { type: Number, default: 0 },   // Nombre de leads générés
    clics: { type: Number, default: 0 },   // Nombre de clics
    date_debut: { type: Date },
    date_fin: { type: Date },
    notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Campagne', campagneSchema);