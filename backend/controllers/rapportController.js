const Tournage = require('../models/Tournage');
const Creneau = require('../models/Creneau');
const Contenu = require('../models/Contenu');

// Normalisation universelle du statut (insensible aux accents et à la casse)
// Alignée sur le référentiel partagé par les pages Tournages et Workflow.
const normalizeStatut = (statutRaw) => {
    if (!statutRaw) return 'A faire';
    const s = String(statutRaw).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (s.includes('faire')) return 'A faire';
    if (s.includes('cours')) return 'En cours';
    if (s.includes('valider')) return 'A valider';
    if (s.includes('valide')) return 'Valide';
    if (s.includes('publi')) return 'Publie';
    return 'A faire';
};

// @desc    Générer le rapport hebdomadaire (tournages, créneaux, répartitions)
// @route   GET /api/rapports?startDate=...&endDate=...
const getWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Les dates de début et de fin sont requises." });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Date de reference d'un tournage : sa date de tournage si connue,
        // sinon la date du creneau reserve, sinon sa date de creation (fallback).
        const getDateEffective = (t) => t.date_tournage || t.creneau_id?.date_debut || t.createdAt;

        const [tousLesTournages, creneaux, contenusPublies] = await Promise.all([
            Tournage.find()
                .populate('marque_id', 'nom')
                .populate('intervenant_id', 'nom prenom')
                .populate('creneau_id', 'date_debut'),
            Creneau.find({ date_debut: { $gte: start, $lte: end } })
                .populate('intervenant_id', 'nom prenom')
                .populate('tournage_id', 'titre')
                .sort({ date_debut: 1 }),
            Contenu.find({
                statut_workflow: 'Publié',
                date_publication: { $gte: start, $lte: end }
            })
        ]);

        const tournages = tousLesTournages
            .map(t => {
                const obj = t.toObject();
                obj.date_effective = getDateEffective(t);
                return obj;
            })
            .filter(t => {
                const d = new Date(t.date_effective);
                return d >= start && d <= end;
            })
            .sort((a, b) => new Date(a.date_effective) - new Date(b.date_effective));

        const totalTournages = tournages.length;
        const totalCreneaux = creneaux.length;
        const totalContenusPublies = contenusPublies.length;

        const parStatut = tournages.reduce((acc, t) => {
            const statut = normalizeStatut(t.statut);
            acc[statut] = (acc[statut] || 0) + 1;
            return acc;
        }, {});

        const parMarque = tournages.reduce((acc, t) => {
            const nom = t.marque_id?.nom || 'Sans marque';
            acc[nom] = (acc[nom] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            periode: { startDate, endDate },
            kpis: {
                totalTournages,
                totalCreneaux,
                totalContenusPublies
            },
            repartition: {
                parStatut,
                parMarque
            },
            tournages,
            creneaux
        });

    } catch (error) {
        console.error('Erreur getWeeklyReport:', error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getWeeklyReport };
