const Campagne = require('../models/Campagne');

const getCampagnes = async (req, res) => {
    try {
        const campagnes = await Campagne.find()
            .populate('marque_id')
            .sort({ createdAt: -1 });
        res.status(200).json(campagnes);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des campagnes : " + error.message });
    }
};

const getCampagneById = async (req, res) => {
    try {
        const campagne = await Campagne.findById(req.params.id).populate('marque_id');
        if (!campagne) {
            return res.status(404).json({ message: "Campagne introuvable" });
        }
        res.status(200).json(campagne);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la campagne : " + error.message });
    }
};

const createCampagne = async (req, res) => {
    const {
        nom,
        marque_id,
        type,
        statut,
        budget,
        depense,
        leads,
        clics,
        date_debut,
        date_fin,
        notes
    } = req.body;

    try {
        const nouvelleCampagne = new Campagne({
            nom,
            // Si marque_id est une chaîne vide, on enregistre null pour éviter un bug de Cast Mongoose
            marque_id: marque_id === "" ? null : marque_id,
            type: type || 'Google Ads',
            statut: statut || 'Brouillon',
            budget: budget !== undefined ? Number(budget) : 0,
            depense: depense !== undefined ? Number(depense) : 0,
            leads: leads !== undefined ? Number(leads) : 0,
            clics: clics !== undefined ? Number(clics) : 0,
            date_debut: date_debut || null,
            date_fin: date_fin || null,
            notes
        });

        const campagneSauvegardee = await nouvelleCampagne.save();

        // On récupère la campagne fraîchement créée en y ajoutant le populate de la marque
        const completeCampagne = await Campagne.findById(campagneSauvegardee._id).populate('marque_id');
        res.status(201).json(completeCampagne);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la création de la campagne : " + error.message });
    }
};

const updateCampagne = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Sécurité pour éviter que MongoDB refuse une string vide sur un ObjectId
        if (updateData.marque_id === "") {
            updateData.marque_id = null;
        }

        const campagneModifiee = await Campagne.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('marque_id');

        if (!campagneModifiee) {
            return res.status(404).json({ message: "Campagne introuvable" });
        }
        res.status(200).json(campagneModifiee);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la modification de la campagne : " + error.message });
    }
};

const deleteCampagne = async (req, res) => {
    try {
        const campagneSupprimee = await Campagne.findByIdAndDelete(req.params.id);
        if (!campagneSupprimee) {
            return res.status(404).json({ message: "Campagne introuvable" });
        }
        res.status(200).json({ message: "La campagne a été supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression de la campagne : " + error.message });
    }
};

module.exports = { getCampagnes, getCampagneById, createCampagne, updateCampagne, deleteCampagne };
