const Marque = require('../models/Marque');

const getMarques = async (req, res) => {
    try {
        const marques = await Marque.find();
        res.status(200).json(marques);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const createMarque = async (req, res) => {
    try {
        const marque = new Marque(req.body);
        await marque.save();
        res.status(201).json(marque);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const updateMarque = async (req, res) => {
    try {
        const marque = await Marque.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!marque) {
            return res.status(404).json({ message: 'Marque non trouvee.' });
        }
        res.status(200).json(marque);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const deleteMarque = async (req, res) => {
    try {
        const marque = await Marque.findByIdAndDelete(req.params.id);
        if (!marque) {
            return res.status(404).json({ message: 'Marque non trouvee.' });
        }
        res.status(200).json({ message: 'Marque supprimee.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getMarques, createMarque, updateMarque, deleteMarque };