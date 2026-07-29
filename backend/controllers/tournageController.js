const Tournage = require('../models/Tournage');
let Creneau;
try {
  Creneau = require('../models/Creneau');
} catch (e) {
  // Au cas où le modèle Creneau n'est pas utilisé directement
}

// @desc    Obtenir tous les tournages
// @route   GET /api/tournages
exports.getTournages = async (req, res) => {
    try {
        const tournages = await Tournage.find()
            .populate('marque_id')
            .populate('intervenant_id')
            .populate('creneau_id');
            
        res.status(200).json(tournages);
    } catch (error) {
        console.error('Erreur getTournages:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tournages', error: error.message });
    }
};

// @desc    Obtenir un tournage par ID
// @route   GET /api/tournages/:id
exports.getTournageById = async (req, res) => {
    try {
        const tournage = await Tournage.findById(req.params.id)
            .populate('marque_id')
            .populate('intervenant_id')
            .populate('creneau_id');

        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouvé' });
        }

        res.status(200).json(tournage);
    } catch (error) {
        console.error('Erreur getTournageById:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du tournage', error: error.message });
    }
};

// @desc    Créer un nouveau tournage
// @route   POST /api/tournages
exports.createTournage = async (req, res) => {
    try {
        const {
            titre,
            marque_id,
            intervenant_id,
            creneau_id,
            statut,
            type_contenu,
            plateforme,
            priorite,
            date_publication_prevue,
            brief,
            notes_internes
        } = req.body;

        const newTournage = new Tournage({
            titre,
            marque_id: marque_id || null,
            intervenant_id: intervenant_id || null,
            creneau_id: creneau_id || null,
            statut: statut || 'À faire',
            type_contenu: type_contenu || 'presentation',
            plateforme: plateforme || 'Instagram',
            priorite: priorite || 'Moyenne',
            date_publication_prevue: date_publication_prevue || null,
            brief: brief || '',
            notes_internes: notes_internes || ''
        });

        const savedTournage = await newTournage.save();

        // Associer le créneau si un creneau_id a été transmis
        if (creneau_id && Creneau) {
            await Creneau.findByIdAndUpdate(creneau_id, { tournage_id: savedTournage._id });
        }

        res.status(201).json(savedTournage);
    } catch (error) {
        console.error('Erreur createTournage:', error);
        res.status(400).json({ message: 'Erreur lors de la création du tournage', error: error.message });
    }
};

// @desc    Mettre à jour un tournage (ou son statut)
// @route   PUT /api/tournages/:id
exports.updateTournage = async (req, res) => {
    try {
        const tournage = await Tournage.findById(req.params.id);
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouvé' });
        }

        const oldCreneauId = tournage.creneau_id;

        // Mise à jour des champs transmis
        Object.assign(tournage, req.body);

        // Nettoyage des chaînes vides pour la base de données
        if (req.body.intervenant_id === '') tournage.intervenant_id = null;
        if (req.body.marque_id === '') tournage.marque_id = null;
        if (req.body.creneau_id === '') tournage.creneau_id = null;

        const updatedTournage = await tournage.save();

        // Mettre à jour la liaison avec le créneau si nécessaire
        if (Creneau && String(oldCreneauId) !== String(updatedTournage.creneau_id)) {
            if (oldCreneauId) {
                await Creneau.findByIdAndUpdate(oldCreneauId, { tournage_id: null });
            }
            if (updatedTournage.creneau_id) {
                await Creneau.findByIdAndUpdate(updatedTournage.creneau_id, { tournage_id: updatedTournage._id });
            }
        }

        res.status(200).json(updatedTournage);
    } catch (error) {
        console.error('Erreur updateTournage:', error);
        res.status(400).json({ message: 'Erreur lors de la mise à jour du tournage', error: error.message });
    }
};

// @desc    Supprimer un tournage
// @route   DELETE /api/tournages/:id
exports.deleteTournage = async (req, res) => {
    try {
        const tournage = await Tournage.findById(req.params.id);
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouvé' });
        }

        // Délier le créneau si nécessaire
        if (tournage.creneau_id && Creneau) {
            await Creneau.findByIdAndUpdate(tournage.creneau_id, { tournage_id: null });
        }

        await Tournage.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Tournage supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteTournage:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du tournage', error: error.message });
    }
};