const Creneau = require('../models/Creneau');

const getCreneaux = async (req, res) => {
    try {
        const creneaux = await Creneau.find()
            .populate('intervenant_id', 'nom prenom')
            .populate('tournage_id', 'titre');
        res.status(200).json(creneaux);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la recuperation des creneaux.', error: error.message });
    }
};

const createCreneau = async (req, res) => {
    try {
        const nouveauCreneau = new Creneau(req.body);
        await nouveauCreneau.save();
        const creneauPeuple = await Creneau.findById(nouveauCreneau._id)
            .populate('intervenant_id', 'nom prenom')
            .populate('tournage_id', 'titre');
        res.status(201).json(creneauPeuple);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la reservation du creneau.', error: error.message });
    }
};

const updateCreneau = async (req, res) => {
    try {
        const creneau = await Creneau.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('intervenant_id', 'nom prenom')
            .populate('tournage_id', 'titre');
        if (!creneau) {
            return res.status(404).json({ message: 'Creneau introuvable.' });
        }
        res.status(200).json(creneau);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la modification du creneau.', error: error.message });
    }
};

const deleteCreneau = async (req, res) => {
    try {
        const creneau = await Creneau.findByIdAndDelete(req.params.id);
        if (!creneau) {
            return res.status(404).json({ message: 'Creneau introuvable.' });
        }
        res.status(200).json({ message: 'Creneau supprime.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du creneau.', error: error.message });
    }
};

module.exports = { getCreneaux, createCreneau, updateCreneau, deleteCreneau };