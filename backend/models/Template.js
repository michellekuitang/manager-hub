const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    type: { type: String, required: true },
    pilier: { type: String, required: true },
    plateforme: { type: String, required: true },
    temps_estime: { type: Number },
    brief: { type: String },
    legende: { type: String },
    hashtags: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);