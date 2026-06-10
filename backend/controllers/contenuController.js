const Contenu = require('../models/Contenu');

const TRANSITIONS_AUTORISEES = {
    'A faire': ['En cours'],
    'En cours': ['A valider'],
    'A valider': ['Valide', 'En cours'],
    'Valide': ['Publie'],
    'Publie': []
};

const getContenus = async (req, res) => {
    try {
        const contenus = await Contenu.find()
            .populate('tournage_id', 'titre')
            .populate('responsable_id', 'nom prenom');
        res.status(200).json(contenus);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const createContenu = async (req, res) => {
    try {
        const contenu = new Contenu(req.body);
        await contenu.save();
        res.status(201).json(contenu);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const updateStatutContenu = async (req, res) => {
    try {
        const { nouveau_statut } = req.body;
        const contenu = await Contenu.findById(req.params.id);

        if (!contenu) {
            return res.status(404).json({ message: 'Contenu non trouve.' });
        }

        const transitionsAutorisees = TRANSITIONS_AUTORISEES[contenu.statut_workflow];
        if (!transitionsAutorisees.includes(nouveau_statut)) {
            return res.status(400).json({
                message: `Transition non autorisee : ${contenu.statut_workflow} -> ${nouveau_statut}`
            });
        }

        contenu.statut_workflow = nouveau_statut;
        await contenu.save();

        res.status(200).json(contenu);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const updateContenu = async (req, res) => {
    try {
        const contenu = await Contenu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!contenu) {
            return res.status(404).json({ message: 'Contenu non trouve.' });
        }
        res.status(200).json(contenu);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const deleteContenu = async (req, res) => {
    try {
        const contenu = await Contenu.findByIdAndDelete(req.params.id);
        if (!contenu) {
            return res.status(404).json({ message: 'Contenu non trouve.' });
        }
        res.status(200).json({ message: 'Contenu supprime.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getContenus, createContenu, updateStatutContenu, updateContenu, deleteContenu };