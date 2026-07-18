const Tournage = require('../models/Tournage');
const Creneau = require('../models/Creneau'); // 🔧 Import indispensable pour la synchronisation

const getTournages = async (req, res) => {
    try {
        const tournages = await Tournage.find()
            .populate('marque_id', 'nom')
            .populate('intervenant_id', 'nom prenom')
            .populate('creneau_id'); 
        res.status(200).json(tournages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const getTournageById = async (req, res) => {
    try {
        const tournage = await Tournage.findById(req.params.id)
            .populate('marque_id', 'nom')
            .populate('intervenant_id', 'nom prenom')
            .populate('creneau_id'); 
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouvé.' });
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

        // ⚡ Si un créneau est associé à la création, on le réserve automatiquement
        if (tournage.creneau_id) {
            await Creneau.findByIdAndUpdate(tournage.creneau_id, {
                statut: 'Reserve',
                tournage_id: tournage._id
            });
        }

        // Renvoi de l'objet complet peuplé pour le state React
        const tournagePeuple = await Tournage.findById(tournage._id)
            .populate('marque_id', 'nom')
            .populate('intervenant_id', 'nom prenom')
            .populate('creneau_id');

        res.status(201).json(tournagePeuple);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création.', error: error.message });
    }
};

const updateTournage = async (req, res) => {
    try {
        // 1. On récupère l'ancien état du tournage pour pister les changements de créneau
        const ancienTournage = await Tournage.findById(req.params.id);
        if (!ancienTournage) {
            return res.status(404).json({ message: 'Tournage non trouvé.' });
        }

        // 2. Mise à jour globale du tournage
        const tournageMisAJour = await Tournage.findByIdAndUpdate(req.params.id, req.body, { new: true });

        const ancienCreneauId = ancienTournage.creneau_id ? ancienTournage.creneau_id.toString() : null;
        const nouveauCreneauId = req.body.creneau_id ? req.body.creneau_id.toString() : null;

        // 3. Si le créneau a changé ou a été retiré, on libère l'ancien créneau
        if (ancienCreneauId && ancienCreneauId !== nouveauCreneauId) {
            await Creneau.findByIdAndUpdate(ancienCreneauId, {
                statut: 'Disponible',
                $unset: { tournage_id: 1 } // Supprime la clé proprement dans MongoDB
            });
        }

        // 4. Si un nouveau créneau prend la place, on le verrouille
        if (nouveauCreneauId && nouveauCreneauId !== ancienCreneauId) {
            await Creneau.findByIdAndUpdate(nouveauCreneauId, {
                statut: 'Reserve',
                tournage_id: tournageMisAJour._id
            });
        }

        // Renvoi immédiat des données fraîches et peuplées
        const tournagePeuple = await Tournage.findById(tournageMisAJour._id)
            .populate('marque_id', 'nom')
            .populate('intervenant_id', 'nom prenom')
            .populate('creneau_id');

        res.status(200).json(tournagePeuple);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const deleteTournage = async (req, res) => {
    try {
        const tournage = await Tournage.findById(req.params.id);
        if (!tournage) {
            return res.status(404).json({ message: 'Tournage non trouvé.' });
        }

        // ⚡ Si le tournage qu'on supprime avait un créneau réservé, on le libère !
        if (tournage.creneau_id) {
            await Creneau.findByIdAndUpdate(tournage.creneau_id, {
                statut: 'Disponible',
                $unset: { tournage_id: 1 }
            });
        }

        await Tournage.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Tournage supprimé.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getTournages, getTournageById, createTournage, updateTournage, deleteTournage };