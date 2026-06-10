const mongoose = require('mongoose');

const contenuSchema = new mongoose.Schema({
    tournage_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournage', required: true },
    responsable_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    titre: { type: String, required: true },
    type_contenu: { type: String },
    statut_workflow: { type: String, enum: ['A faire', 'En cours', 'A valider', 'Valide', 'Publie'], default: 'A faire' },
    pilier: { type: String },
    description: { type: String },
    script_ia: { type: String },
    caption_ia: { type: String },
    date_creation: { type: Date, default: Date.now },
    date_publication: { type: Date }
});

module.exports = mongoose.model('Contenu', contenuSchema);