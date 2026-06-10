const mongoose = require('mongoose');

const marqueSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    logo: { type: String },
    description: { type: String },
    actif: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('Marque', marqueSchema);