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
    role: {
        type: String,
        enum: ['Administrateur', 'Community Manager', 'Modérateur'],
        default: 'Community Manager'
    },
    actif: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Crée automatiquement createdAt et updatedAt
});

module.exports = mongoose.model('Equipe', equipeSchema);