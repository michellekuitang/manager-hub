const express = require('express');
const router = express.Router();
const Campagne = require('../models/Campagne');

// ==========================================
// 1. OBTENIR TOUTES LES CAMPAGNES (GET /)
// ==========================================
router.get('/', async (req, res) => {
    try {
        // .populate('marque_id') permet de récupérer l'objet Marque complet à la place de l'ID seul
        const campagnes = await Campagne.find()
            .populate('marque_id')
            .sort({ createdAt: -1 }); // Trie les campagnes de la plus récente à la plus ancienne
        res.json(campagnes);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des campagnes : " + err.message });
    }
});

// ==========================================
// 2. OBTENIR UNE CAMPAGNE PAR SON ID (GET /:id)
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const campagne = await Campagne.findById(req.params.id).populate('marque_id');
        if (!campagne) {
            return res.status(404).json({ message: "Campagne introuvable" });
        }
        res.json(campagne);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération de la campagne : " + err.message });
    }
});

// ==========================================
// 3. CRÉER UNE NOUVELLE CAMPAGNE (POST /)
// ==========================================
router.post('/', async (req, res) => {
    const { 
        nom, 
        marque_id, 
        type, 
        statut, 
        budget, 
        depense, 
        leads, 
        clics, 
        date_debut, 
        date_fin, 
        notes 
    } = req.body;

    const nouvelleCampagne = new Campagne({
        nom,
        // Si marque_id est une chaîne vide, on enregistre null pour éviter un bug de Cast Mongoose
        marque_id: marque_id === "" ? null : marque_id, 
        type: type || 'Google Ads',
        statut: statut || 'Brouillon',
        budget: budget !== undefined ? Number(budget) : 0,
        depense: depense !== undefined ? Number(depense) : 0,
        leads: leads !== undefined ? Number(leads) : 0,
        clics: clics !== undefined ? Number(clics) : 0,
        date_debut: date_debut || null,
        date_fin: date_fin || null,
        notes
    });

    try {
        const campagneSauvegardee = await nouvelleCampagne.save();
        
        // On récupère la campagne fraîchement créée en y ajoutant le populate de la marque
        const completeCampagne = await Campagne.findById(campagneSauvegardee._id).populate('marque_id');
        res.status(201).json(completeCampagne);
    } catch (err) {
        res.status(400).json({ message: "Erreur lors de la création de la campagne : " + err.message });
    }
});

// ==========================================
// 4. MODIFIER UNE CAMPAGNE EXISTANTE (PUT /:id)
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Sécurité pour éviter que MongoDB refuse une string vide sur un ObjectId
        if (updateData.marque_id === "") {
            updateData.marque_id = null;
        }

        const campagneModifiee = await Campagne.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true } // "new: true" renvoie le document modifié
        ).populate('marque_id');

        if (!campagneModifiee) {
            return res.status(404).json({ message: "Campagne introuvable" });
        }
        res.json(campagneModifiee);
    } catch (err) {
        res.status(400).json({ message: "Erreur lors de la modification de la campagne : " + err.message });
    }
});

// ==========================================
// 5. SUPPRIMER UNE CAMPAGNE (DELETE /:id)
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const campagneSupprimee = await Campagne.findByIdAndDelete(req.params.id);
        
        if (!campagneSupprimee) {
            return res.status(404).json({ message: "Campagne introuvable" });
        }
        res.json({ message: "La campagne a été supprimée avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression de la campagne : " + err.message });
    }
});

module.exports = router;