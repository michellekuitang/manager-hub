const mongoose = require('mongoose');

const tournageSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    date_tournage: { type: Date, default: Date.now },
    lieu: { type: String },
    type_contenu: { type: String, default: 'interview' },
    plateforme: { type: String, default: 'Instagram' },
    priorite: { type: String, enum: ['Basse', 'Moyenne', 'Haute'], default: 'Moyenne' },
    statut: { 
        type: String, 
        enum: ['A tourner', 'Tourne', 'Monte', 'Publie'], 
        default: 'A tourner' 
    },
    date_publication_prevue: { type: Date },
    brief: { type: String },
    notes_internes: { type: String },
    marque_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque', required: true },
    intervenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervenant' },
    // Remplacement ici : Liaison par référence ID au lieu d'un schéma imbriqué
    creneau_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Creneau' }
}, { timestamps: true });

module.exports = mongoose.model('Tournage', tournageSchema);