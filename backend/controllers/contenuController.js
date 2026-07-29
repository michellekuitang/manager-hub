const Contenu = require('../models/Contenu');
const Tournage = require('../models/Tournage'); // 🔧 Synchronisation avec les tournages

// Normalise les statuts reçus du front-end (avec ou sans accents)
const NORMALISER_STATUT = (statut) => {
    if (!statut) return 'À faire';
    const map = {
        'A faire': 'À faire',
        'En cours': 'En cours',
        'A valider': 'À valider',
        'Valide': 'Validé',
        'Publie': 'Publié',
        'BROUILLON': 'À faire'
    };
    return map[statut] || statut;
};

// Transitions autorisées alignées sur les colonnes du Kanban React
const TRANSITIONS_AUTORISEES = {
    'À faire': ['En cours'],
    'En cours': ['À faire', 'À valider'],
    'À valider': ['En cours', 'Validé'],
    'Validé': ['À valider', 'Publié'],
    'Publié': ['Validé']
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

// Créer un nouveau contenu
exports.createContenu = async (req, res) => {
    try {
        const currentUserId = req.user?.id || req.user?._id || req.body.auteur || req.body.responsable_id || null;

        // Normalisation du statut envoyé par le client
        const statutNormalise = NORMALISER_STATUT(req.body.statut_workflow);
        const validStatuts = ['À faire', 'En cours', 'À valider', 'Validé', 'Publié'];
        const statutFinal = validStatuts.includes(statutNormalise) ? statutNormalise : 'À faire';

        const nouveauContenu = new Contenu({
            ...req.body,
            statut_workflow: statutFinal,
            auteur: req.body.auteur || currentUserId,
            responsable_id: req.body.responsable_id || currentUserId
        });

        const savedContenu = await nouveauContenu.save();

        // ⚡ Synchronisation bi-directionnelle avec le tournage associé
        if (savedContenu.tournage_id) {
            await Tournage.findByIdAndUpdate(savedContenu.tournage_id, { statut: statutFinal });
        }

        const populatedContenu = await populateContenu(Contenu.findById(savedContenu._id));

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

        // ⚡ Répercuter le statut sur le tournage lié s'il a changé
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

        // ⚡ Mise à jour automatique du statut du tournage parent
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