const mongoose = require('mongoose');

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