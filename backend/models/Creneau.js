const mongoose = require('mongoose');

const creneauSchema = new mongoose.Schema({
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, required: true },
    objet: { type: String },
    statut: { type: String, enum: ['Disponible', 'Reserve'], default: 'Disponible' },
    intervenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervenant' },
    // 🔗 Ajout de la liaison inverse vers le projet de tournage
    tournage_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournage' }
}, { timestamps: true });

module.exports = mongoose.model('Creneau', creneauSchema);