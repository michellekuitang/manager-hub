const mongoose = require('mongoose');

const creneauSchema = new mongoose.Schema({
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, required: true },
    salle: { type: String },
    equipements: { type: String }
});

const tournageSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    date_tournage: { type: Date, required: true },
    lieu: { type: String },
    statut: { type: String, enum: ['Planifie', 'En cours', 'Termine', 'Annule'], default: 'Planifie' },
    description: { type: String },
    marque_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque', required: true },
    intervenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Intervenant' }],
    creneaux: [creneauSchema]
}, { timestamps: true });

module.exports = mongoose.model('Tournage', tournageSchema);