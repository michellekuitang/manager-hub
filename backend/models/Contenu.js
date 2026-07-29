const mongoose = require('mongoose');

const contenuSchema = new mongoose.Schema({
    tournage_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tournage', 
        required: true 
    },
    responsable_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Utilisateur', 
        required: false 
    },
    auteur: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Utilisateur' 
    },
    titre: { 
        type: String, 
        required: true 
    },
    type_contenu: { 
        type: String 
    },
    statut_workflow: { 
        type: String, 
        enum: ['À faire', 'En cours', 'À valider', 'Validé', 'Publié'], 
        default: 'À faire' 
    },
    pilier: { 
        type: String 
    },
    description: { 
        type: String 
    },
    script_ia: { 
        type: String 
    },
    caption_ia: { 
        type: String 
    },
    date_creation: { 
        type: Date, 
        default: Date.now 
    },
    date_publication: { 
        type: Date 
    }
}, { timestamps: true });

module.exports = mongoose.model('Contenu', contenuSchema);