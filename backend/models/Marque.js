const mongoose = require('mongoose');

const marqueSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    logo: { type: String },
    description: { type: String },
    actif: { type: Boolean, default: true },
    campus: { type: String, default: 'Torcy' },
    gere_par: { type: String, default: 'Community Manager' },
    cm_assigne: { type: String, default: '' },
    couleur: { type: String, default: '#4f46e5' }
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('Marque', marqueSchema);