/**
 * Tests du controleur Campagne.
 *
 * Ce controleur vient d'etre refactore : la logique se trouvait auparavant
 * dans le fichier de routes. Ces tests servent de filet de securite apres ce
 * deplacement, et couvrent les valeurs numeriques (budget, depense, leads)
 * qui alimentent le tableau de bord et le rapport hebdomadaire.
 */

const mongoose = require('mongoose');
const Campagne = require('../models/Campagne');
const Marque = require('../models/Marque');
const campagneController = require('../controllers/campagneController');
const { creerRes, creerReq, statutRenvoye, corpsRenvoye } = require('./helpers');

// Une campagne exige obligatoirement une marque : on en cree une pour chaque test.
const creerMarque = async (nom = 'ESIIA') => {
    const marque = await Marque.create({ nom });
    return marque._id.toString();
};

describe('createCampagne', () => {

    it('cree une campagne et applique les valeurs par defaut', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({ body: { nom: 'Rentree 2026', marque_id: marqueId } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(statutRenvoye(res)).toBe(201);

        const campagne = corpsRenvoye(res);
        expect(campagne.nom).toBe('Rentree 2026');
        expect(campagne.type).toBe('Google Ads');
        expect(campagne.statut).toBe('Brouillon');
        expect(campagne.budget).toBe(0);
        expect(campagne.depense).toBe(0);
        expect(campagne.leads).toBe(0);
        expect(campagne.clics).toBe(0);
    });

    it('renvoie la marque peuplee', async () => {
        const marqueId = await creerMarque('ESUV');
        const req = creerReq({ body: { nom: 'Campagne ESUV', marque_id: marqueId } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(corpsRenvoye(res).marque_id.nom).toBe('ESUV');
    });

    it('refuse une campagne sans marque', async () => {
        const req = creerReq({ body: { nom: 'Sans marque' } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Campagne.countDocuments()).toBe(0);
    });

    it('refuse une marque transmise sous forme de chaine vide', async () => {
        const req = creerReq({ body: { nom: 'Marque vide', marque_id: '' } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        // La chaine vide est convertie en null, que le champ requis rejette.
        // C'est le comportement voulu : on evite une erreur de conversion
        // Mongoose au profit d'un message de validation clair.
        expect(statutRenvoye(res)).toBe(400);
    });

    it('refuse une campagne sans nom', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({ body: { marque_id: marqueId } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('convertit les valeurs numeriques transmises en texte', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({
            body: {
                nom: 'Campagne chiffree',
                marque_id: marqueId,
                budget: '1500',
                depense: '450.50',
                leads: '90',
                clics: '3200'
            }
        });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        const campagne = corpsRenvoye(res);
        expect(campagne.budget).toBe(1500);
        expect(campagne.depense).toBe(450.5);
        expect(campagne.leads).toBe(90);
        expect(campagne.clics).toBe(3200);
    });

    it('accepte les quatre statuts du referentiel', async () => {
        const marqueId = await creerMarque();

        for (const statut of ['Active', 'Terminée', 'À venir', 'Brouillon']) {
            const req = creerReq({ body: { nom: `Campagne ${statut}`, marque_id: marqueId, statut } });
            const res = creerRes();

            await campagneController.createCampagne(req, res);

            expect(statutRenvoye(res)).toBe(201);
            expect(corpsRenvoye(res).statut).toBe(statut);
        }
    });

    it('refuse un statut absent du referentiel', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({ body: { nom: 'Campagne', marque_id: marqueId, statut: 'Suspendue' } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('enregistre le campus transmis', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({
            body: { nom: 'Campagne Lille', marque_id: marqueId, campus: 'Lille' }
        });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(corpsRenvoye(res).campus).toBe('Lille');
    });

    it('applique le campus "Tous" par defaut', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({ body: { nom: 'Campagne nationale', marque_id: marqueId } });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(corpsRenvoye(res).campus).toBe('Tous');
    });

    it('refuse un budget negatif', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({
            body: { nom: 'Budget negatif', marque_id: marqueId, budget: -100 }
        });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Campagne.countDocuments()).toBe(0);
    });

    it('refuse un nombre de leads negatif', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({
            body: { nom: 'Leads negatifs', marque_id: marqueId, leads: -5 }
        });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('enregistre les dates de debut et de fin', async () => {
        const marqueId = await creerMarque();
        const req = creerReq({
            body: {
                nom: 'Campagne datee',
                marque_id: marqueId,
                date_debut: '2026-09-01',
                date_fin: '2026-09-30'
            }
        });
        const res = creerRes();

        await campagneController.createCampagne(req, res);

        const campagne = corpsRenvoye(res);
        expect(new Date(campagne.date_debut).toISOString().slice(0, 10)).toBe('2026-09-01');
        expect(new Date(campagne.date_fin).toISOString().slice(0, 10)).toBe('2026-09-30');
    });
});

describe('getCampagnes', () => {

    it('renvoie une liste vide quand aucune campagne n existe', async () => {
        const res = creerRes();

        await campagneController.getCampagnes(creerReq(), res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res)).toEqual([]);
    });

    it('renvoie les campagnes de la plus recente a la plus ancienne', async () => {
        const marqueId = await creerMarque();

        const ancienne = await Campagne.create({ nom: 'Ancienne', marque_id: marqueId });
        const recente = await Campagne.create({ nom: 'Recente', marque_id: marqueId });

        // Mongoose gere createdAt automatiquement : on force des dates
        // distinctes en base pour que le tri soit verifiable sans dependre
        // de la vitesse d'execution des tests.
        await Campagne.collection.updateOne(
            { _id: ancienne._id },
            { $set: { createdAt: new Date('2026-01-15T10:00:00.000Z') } }
        );
        await Campagne.collection.updateOne(
            { _id: recente._id },
            { $set: { createdAt: new Date('2026-06-15T10:00:00.000Z') } }
        );

        const res = creerRes();
        await campagneController.getCampagnes(creerReq(), res);

        const campagnes = corpsRenvoye(res);
        expect(campagnes).toHaveLength(2);
        expect(campagnes[0].nom).toBe('Recente');
    });
});

describe('getCampagneById', () => {

    it('renvoie la campagne demandee', async () => {
        const marqueId = await creerMarque();
        const campagne = await Campagne.create({ nom: 'Campagne test', marque_id: marqueId });

        const req = creerReq({ params: { id: campagne._id.toString() } });
        const res = creerRes();

        await campagneController.getCampagneById(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).nom).toBe('Campagne test');
    });

    it('renvoie une erreur 404 pour un identifiant inconnu', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await campagneController.getCampagneById(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});

describe('updateCampagne', () => {

    it('met a jour les champs transmis', async () => {
        const marqueId = await creerMarque();
        const campagne = await Campagne.create({ nom: 'Ancien nom', marque_id: marqueId, budget: 100 });

        const req = creerReq({
            params: { id: campagne._id.toString() },
            body: { nom: 'Nouveau nom', budget: 2000 }
        });
        const res = creerRes();

        await campagneController.updateCampagne(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).nom).toBe('Nouveau nom');
        expect(corpsRenvoye(res).budget).toBe(2000);
    });

    it('met a jour les leads et la depense', async () => {
        const marqueId = await creerMarque();
        const campagne = await Campagne.create({ nom: 'Campagne', marque_id: marqueId });

        const req = creerReq({
            params: { id: campagne._id.toString() },
            body: { leads: 450, depense: 90 }
        });
        const res = creerRes();

        await campagneController.updateCampagne(req, res);

        const modifiee = corpsRenvoye(res);
        expect(modifiee.leads).toBe(450);
        expect(modifiee.depense).toBe(90);
        // Cout par lead affiche sur le tableau de bord : 90 / 450 = 0,20 euro.
        expect(modifiee.depense / modifiee.leads).toBeCloseTo(0.2);
    });

    it('refuse un statut invalide lors de la mise a jour', async () => {
        const marqueId = await creerMarque();
        const campagne = await Campagne.create({ nom: 'Campagne', marque_id: marqueId });

        const req = creerReq({
            params: { id: campagne._id.toString() },
            body: { statut: 'Suspendue' }
        });
        const res = creerRes();

        await campagneController.updateCampagne(req, res);

        // runValidators est active dans le controleur : l'enum est verifie
        // aussi lors des mises a jour, pas seulement a la creation.
        expect(statutRenvoye(res)).toBe(400);
    });

    it('renvoie une erreur 404 si la campagne n existe pas', async () => {
        const req = creerReq({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { nom: 'Peu importe' }
        });
        const res = creerRes();

        await campagneController.updateCampagne(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});

describe('deleteCampagne', () => {

    it('supprime la campagne demandee', async () => {
        const marqueId = await creerMarque();
        const campagne = await Campagne.create({ nom: 'A supprimer', marque_id: marqueId });

        const req = creerReq({ params: { id: campagne._id.toString() } });
        const res = creerRes();

        await campagneController.deleteCampagne(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(await Campagne.countDocuments()).toBe(0);
    });

    it('renvoie une erreur 404 si la campagne n existe pas', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await campagneController.deleteCampagne(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});