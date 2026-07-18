const mongoose = require('mongoose');

const equipeSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true
    },
    prenom: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    telephone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        default: 'Photographe',
        trim: true // Plus de "enum", c'est devenu un texte libre !
    },
    marque: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marque' // Permet de lier le membre à une école existante
    },
    actif: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Equipe', equipeSchema);