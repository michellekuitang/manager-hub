const Equipe = require('../models/Equipe');

// 1. Récupérer tous les membres de l'équipe
exports.getMembres = async (req, res) => {
    try {
        const membres = await Equipe.find().sort({ createdAt: -1 });
        res.status(200).json(membres);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des membres", error: err.message });
    }
};

// 2. Ajouter un nouveau membre
exports.createMembre = async (req, res) => {
    try {
        const { nom, prenom, email, role, actif } = req.body;

        // Vérifier si l'email existe déjà
        const emailExiste = await Equipe.findOne({ email });
        if (emailExiste) {
            return res.status(400).json({ message: "Un membre avec cet email existe déjà." });
        }

        const nouveauMembre = new Equipe({ nom, prenom, email, role, actif });
        await nouveauMembre.save();
        
        res.status(201).json(nouveauMembre);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la création du membre", error: err.message });
    }
};

// 3. Modifier un membre existant
exports.updateMembre = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, role, actif } = req.body;

        const membreModifie = await Equipe.findByIdAndUpdate(
            id,
            { nom, prenom, email, role, actif },
            { new: true, runValidators: true }
        );

        if (!membreModifie) {
            return res.status(404).json({ message: "Membre introuvable." });
        }

        res.status(200).json(membreModifie);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la modification du membre", error: err.message });
    }
};

// 4. Supprimer un membre
exports.deleteMembre = async (req, res) => {
    try {
        const { id } = req.params;
        const membreSupprime = await Equipe.findByIdAndDelete(id);

        if (!membreSupprime) {
            return res.status(404).json({ message: "Membre introuvable." });
        }

        res.status(200).json({ message: "Membre supprimé avec succès." });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression du membre", error: err.message });
    }
};