const Equipe = require('../models/Equipe');

// Une erreur de validation Mongoose (champ manquant, id malforme, etc.) vient
// de la requete du client, pas d'une panne serveur : elle doit renvoyer 400, pas 500.
const estErreurDeRequete = (error) => error.name === 'ValidationError' || error.name === 'CastError';

// 1. Récupérer tous les membres de l'équipe
exports.getMembres = async (req, res) => {
    try {
        // On peuple la marque pour récupérer son nom dans le frontend
        const membres = await Equipe.find().populate('marque', 'nom').sort({ createdAt: -1 });
        res.status(200).json(membres);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des membres", error: err.message });
    }
};

// 2. Ajouter un nouveau membre
exports.createMembre = async (req, res) => {
    try {
        // Ajout de telephone et marque
        const { nom, prenom, email, telephone, role, marque, actif } = req.body;

        const emailExiste = await Equipe.findOne({ email });
        if (emailExiste) {
            return res.status(400).json({ message: "Un membre avec cet email existe déjà." });
        }

        const nouveauMembre = new Equipe({ nom, prenom, email, telephone, role, marque, actif });
        await nouveauMembre.save();

        res.status(201).json(nouveauMembre);
    } catch (err) {
        const statutCode = estErreurDeRequete(err) ? 400 : 500;
        res.status(statutCode).json({ message: "Erreur lors de la création du membre", error: err.message });
    }
};

// 3. Modifier un membre existant
exports.updateMembre = async (req, res) => {
    try {
        const { id } = req.params;
        // Ajout de telephone et marque
        const { nom, prenom, email, telephone, role, marque, actif } = req.body;

        const membreModifie = await Equipe.findByIdAndUpdate(
            id,
            { nom, prenom, email, telephone, role, marque, actif },
            { new: true, runValidators: true }
        );

        if (!membreModifie) {
            return res.status(404).json({ message: "Membre introuvable." });
        }

        res.status(200).json(membreModifie);
    } catch (err) {
        const statutCode = estErreurDeRequete(err) ? 400 : 500;
        res.status(statutCode).json({ message: "Erreur lors de la modification du membre", error: err.message });
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
        const statutCode = estErreurDeRequete(err) ? 400 : 500;
        res.status(statutCode).json({ message: "Erreur lors de la suppression du membre", error: err.message });
    }
};
