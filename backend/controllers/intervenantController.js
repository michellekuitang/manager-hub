const Intervenant = require('../models/Intervenant');

const getIntervenants = async (req, res) => {
    try {
        const intervenants = await Intervenant.find().populate('marque_id', 'nom');
        res.status(200).json(intervenants);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const createIntervenant = async (req, res) => {
    try {
        const intervenant = new Intervenant(req.body);
        await intervenant.save();
        const intervenantPopule = await Intervenant.findById(intervenant._id).populate('marque_id', 'nom');
        res.status(201).json(intervenantPopule);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const updateIntervenant = async (req, res) => {
    try {
        const intervenant = await Intervenant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('marque_id', 'nom');
        if (!intervenant) {
            return res.status(404).json({ message: 'Intervenant non trouve.' });
        }
        res.status(200).json(intervenant);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const deleteIntervenant = async (req, res) => {
    try {
        const intervenant = await Intervenant.findByIdAndDelete(req.params.id);
        if (!intervenant) {
            return res.status(404).json({ message: 'Intervenant non trouve.' });
        }
        res.status(200).json({ message: 'Intervenant supprime.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getIntervenants, createIntervenant, updateIntervenant, deleteIntervenant };