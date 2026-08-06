const Contenu = require('../models/Contenu'); // Assure-toi que le chemin vers le modèle est correct
const Tournage = require('../models/Tournage'); // Requis pour la répercussion du statut

// Transitions autorisées alignées sur les colonnes du Kanban React
const TRANSITIONS_AUTORISEES = {
    'À faire': ['En cours'],
    'En cours': ['À faire', 'À valider'],
    'À valider': ['En cours', 'Validé'],
    'Validé': ['À valider', 'Publié'],
    'Publié': ['Validé']
};

// Helper pour normaliser la casse et les accents des statuts si nécessaire
const NORMALISER_STATUT = (statut) => {
    if (!statut) return 'À faire';
    // Gère les variations courantes pour correspondre exactement aux clés du Kanban
    const mapping = {
        'a faire': 'À faire',
        'à faire': 'À faire',
        'en cours': 'En cours',
        'a valider': 'À valider',
        'à valider': 'À valider',
        'valide': 'Validé',
        'validé': 'Validé',
        'publie': 'Publié',
        'publié': 'Publié'
    };
    return mapping[statut.toLowerCase()] || statut;
};

// Helper réutilisable pour populer l'auteur, le responsable, le tournage et la marque
const populateContenu = (query) => {
    return query
        .populate('auteur', 'nom prenom email')
        .populate('responsable_id', 'nom prenom email')
        .populate({
            path: 'tournage_id',
            populate: { path: 'marque_id', select: 'nom' }
        });
};

// Récupérer tous les contenus
exports.getContenus = async (req, res) => {
    try {
        const contenus = await populateContenu(Contenu.find()).sort({ updatedAt: -1 });
        res.status(200).json(contenus);
    } catch (error) {
        console.error('Erreur getContenus :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des contenus', error: error.message });
    }
};

// Récupérer un contenu par son ID
exports.getContenuById = async (req, res) => {
    try {
        const contenu = await populateContenu(Contenu.findById(req.params.id));
        if (!contenu) {
            return res.status(404).json({ message: 'Contenu non trouvé' });
        }
        res.status(200).json(contenu);
    } catch (error) {
        console.error('Erreur getContenuById :', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Créer un nouveau contenu (Fonction complétée)
exports.createContenu = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.statut_workflow) {
            data.statut_workflow = NORMALISER_STATUT(data.statut_workflow);
        }

        const nouveauContenu = new Contenu(data);
        const contenuSauvegardee = await nouveauContenu.save();

        // Répercuter le statut sur le tournage lié s'il existe
        if (contenuSauvegardee.tournage_id && contenuSauvegardee.statut_workflow) {
            await Tournage.findByIdAndUpdate(contenuSauvegardee.tournage_id, { statut: contenuSauvegardee.statut_workflow });
        }

        const populatedContenu = await populateContenu(Contenu.findById(contenuSauvegardee._id));
        res.status(201).json(populatedContenu);
    } catch (error) {
        console.error('Erreur createContenu :', error);
        res.status(400).json({ message: 'Erreur lors de la création', error: error.message });
    }
};

// Mettre à jour les informations d'un contenu
exports.updateContenu = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.statut_workflow) {
            updateData.statut_workflow = NORMALISER_STATUT(updateData.statut_workflow);
        }

        const contenuModifie = await Contenu.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!contenuModifie) {
            return res.status(404).json({ message: 'Contenu non trouvé' });
        }

        // Répercuter le statut sur le tournage lié s'il a changé
        if (contenuModifie.tournage_id && updateData.statut_workflow) {
            await Tournage.findByIdAndUpdate(contenuModifie.tournage_id, { statut: updateData.statut_workflow });
        }

        const populatedContenu = await populateContenu(Contenu.findById(contenuModifie._id));
        res.status(200).json(populatedContenu);
    } catch (error) {
        console.error('Erreur updateContenu :', error);
        res.status(400).json({ message: 'Erreur lors de la mise à jour', error: error.message });
    }
};

// Mettre à jour le statut du workflow (supporte camelCase et snake_case)
exports.updateStatutContenu = async (req, res) => {
    const { id } = req.params;
    let nouveauStatut = req.body.nouveauStatut || req.body.nouveau_statut;

    if (!nouveauStatut) {
        return res.status(400).json({ message: 'Le nouveau statut est requis.' });
    }

    nouveauStatut = NORMALISER_STATUT(nouveauStatut);

    try {
        const contenu = await Contenu.findById(id);
        if (!contenu) {
            return res.status(404).json({ message: 'Contenu non trouvé' });
        }

        const transitions = TRANSITIONS_AUTORISEES[contenu.statut_workflow];
        if (transitions && !transitions.includes(nouveauStatut)) {
            return res.status(400).json({
                message: `Transition non autorisée de "${contenu.statut_workflow}" vers "${nouveauStatut}".`
            });
        }

        contenu.statut_workflow = nouveauStatut;
        await contenu.save();

        // Mise à jour automatique du statut du tournage parent
        if (contenu.tournage_id) {
            await Tournage.findByIdAndUpdate(contenu.tournage_id, { statut: nouveauStatut });
        }

        const contenuMisAJour = await populateContenu(Contenu.findById(contenu._id));
        res.status(200).json(contenuMisAJour);
    } catch (error) {
        console.error('Erreur updateStatutContenu :', error);
        res.status(500).json({ message: 'Erreur lors du changement de statut', error: error.message });
    }
};

// Supprimer un contenu
exports.deleteContenu = async (req, res) => {
    try {
        const contenuSupprime = await Contenu.findByIdAndDelete(req.params.id);
        if (!contenuSupprime) {
            return res.status(404).json({ message: 'Contenu non trouvé' });
        }
        res.status(200).json({ message: 'Contenu supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteContenu :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
};