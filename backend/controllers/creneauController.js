const Creneau = require('../models/Creneau');
const Tournage = require('../models/Tournage'); // 🔧 Import indispensable pour désassocier le créneau

// 1. Récupérer tous les créneaux
const getCreneaux = async (req, res) => {
    try {
        const creneaux = await Creneau.find().populate('tournage_id');
        res.status(200).json(creneaux);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des créneaux.', error: error.message });
    }
};

// 2. Créer un nouveau créneau
const createCreneau = async (req, res) => {
    try {
        const nouveauCreneau = new Creneau(req.body);
        await nouveauCreneau.save();
        res.status(201).json(nouveauCreneau);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du créneau.', error: error.message });
    }
};

// 3. Supprimer un créneau et nettoyer les liens
const deleteCreneau = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si le créneau existe
        const creneau = await Creneau.findById(id);
        if (!creneau) {
            return res.status(404).json({ message: "Créneau non trouvé." });
        }

        // ⚡ Si le créneau était lié à un tournage, on détache proprement le créneau de ce tournage
        await Tournage.updateOne(
            { creneau_id: id },
            { $unset: { creneau_id: 1 } } // Supprime le champ creneau_id du document Tournage
        );

        // Supprimer définitivement le créneau
        await Creneau.findByIdAndDelete(id);

        res.status(200).json({ message: "Créneau supprimé avec succès et tournages nettoyés." });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression du créneau.", error: error.message });
    }
};

module.exports = { 
    getCreneaux, 
    createCreneau, 
    deleteCreneau 
};