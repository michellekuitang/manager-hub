const Campagne = require('../models/Campagne');

const getCampagnes = async (req, res) => {
    try {
        const campagnes = await Campagne.find().populate('marque_id', 'nom');
        res.status(200).json(campagnes);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const createCampagne = async (req, res) => {
    try {
        const campagne = new Campagne(req.body);
        await campagne.save();
        res.status(201).json(campagne);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const updateCampagne = async (req, res) => {
    try {
        const campagne = await Campagne.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!campagne) {
            return res.status(404).json({ message: 'Campagne non trouvee.' });
        }
        res.status(200).json(campagne);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const deleteCampagne = async (req, res) => {
    try {
        const campagne = await Campagne.findByIdAndDelete(req.params.id);
        if (!campagne) {
            return res.status(404).json({ message: 'Campagne non trouvee.' });
        }
        res.status(200).json({ message: 'Campagne supprimee.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getCampagnes, createCampagne, updateCampagne, deleteCampagne };