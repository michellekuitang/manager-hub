const Tournage = require('../models/Tournage');

const getTournages = async (req, res) => {
    try {
        const tournages = await Tournage.find()
            .populate('marque_id', 'nom')
            .populate('intervenants', 'nom prenom');
        res.status(200).json(tournages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const getTournageById = async (req, res) => {
    try {
        const tournage = await Tournage.findById(req.params.id)
            .populate('marque_id', 'nom')
            .populate('intervenants', 'nom prenom');
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouve.' });
        }
        res.status(200).json(tournage);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const createTournage = async (req, res) => {
    try {
        const tournage = new Tournage(req.body);
        await tournage.save();
        res.status(201).json(tournage);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const updateTournage = async (req, res) => {
    try {
        const tournage = await Tournage.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouve.' });
        }
        res.status(200).json(tournage);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const deleteTournage = async (req, res) => {
    try {
        const tournage = await Tournage.findByIdAndDelete(req.params.id);
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouve.' });
        }
        res.status(200).json({ message: 'Tournage supprime.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getTournages, getTournageById, createTournage, updateTournage, deleteTournage };