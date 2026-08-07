const mongoose = require('mongoose');

// Referentiel unique des statuts, partage avec le workflow des contenus.
// Les valeurs sont accentuees : c'est la forme canonique enregistree en base.
// Les controleurs normalisent toute variante recue avant enregistrement.
const STATUTS = ['À faire', 'En cours', 'À valider', 'Validé', 'Publié'];

const tournageSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true
    },
    marque_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Marque',
      default: null
    },
    intervenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intervenant',
      default: null
    },
    creneau_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creneau',
      default: null
    },
    statut: {
      type: String,
      enum: {
        values: STATUTS,
        message: 'Statut invalide : {VALUE}.'
      },
      default: 'À faire'
    },
    date_tournage: {
      type: Date,
      default: null
    },
    lieu: {
      type: String,
      default: ''
    },
    type_contenu: {
      type: String,
      default: 'presentation'
    },
    plateforme: {
      type: String,
      default: 'Instagram'
    },
    priorite: {
      type: String,
      default: 'Moyenne'
    },
    date_publication_prevue: {
      type: Date,
      default: null
    },
    brief: {
      type: String,
      default: ''
    },
    notes_internes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tournage', tournageSchema);
module.exports.STATUTS = STATUTS;