/**
 * Tests du controleur Tournage.
 *
 * Ces tests decrivent le comportement reel du code actuel :
 *   - statut par defaut "A faire" (accentue), referentiel partage avec Contenu
 *   - date de tournage deduite du creneau reserve quand elle n'est pas fournie
 *   - chaines vides converties en null a la mise a jour
 */

const mongoose = require('mongoose');
const Tournage = require('../models/Tournage');
const Creneau = require('../models/Creneau');
const tournageController = require('../controllers/tournageController');
const { creerRes, creerReq, statutRenvoye, corpsRenvoye } = require('./helpers');

describe('createTournage', () => {

    it('cree un tournage et applique les valeurs par defaut', async () => {
        const req = creerReq({ body: { titre: 'Journee portes ouvertes' } });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        expect(statutRenvoye(res)).toBe(201);

        const tournage = corpsRenvoye(res);
        expect(tournage.titre).toBe('Journee portes ouvertes');
        expect(tournage.statut).toBe('À faire');
        expect(tournage.priorite).toBe('Moyenne');
        expect(tournage.type_contenu).toBe('presentation');
        expect(tournage.plateforme).toBe('Instagram');
        expect(tournage.lieu).toBe('');
    });

    it('refuse un tournage sans titre', async () => {
        const req = creerReq({ body: { lieu: 'Studio' } });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Tournage.countDocuments()).toBe(0);
    });

    it('enregistre le lieu et la date de tournage transmis', async () => {
        const req = creerReq({
            body: {
                titre: 'Interview directeur',
                lieu: 'Campus Paris',
                date_tournage: '2026-09-15'
            }
        });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        const tournage = corpsRenvoye(res);
        expect(tournage.lieu).toBe('Campus Paris');
        expect(new Date(tournage.date_tournage).toISOString().slice(0, 10)).toBe('2026-09-15');
    });

    it('laisse la date de tournage nulle quand elle n est pas fournie', async () => {
        const req = creerReq({ body: { titre: 'Sans date' } });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        expect(corpsRenvoye(res).date_tournage).toBeNull();
    });

    it('deduit la date de tournage du creneau reserve', async () => {
        const dateCreneau = new Date('2026-10-02T09:00:00.000Z');
        const creneau = await Creneau.create({
            date_debut: dateCreneau,
            date_fin: new Date('2026-10-02T11:00:00.000Z')
        });

        const req = creerReq({
            body: { titre: 'Tournage planifie', creneau_id: creneau._id.toString() }
        });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        expect(statutRenvoye(res)).toBe(201);
        expect(new Date(corpsRenvoye(res).date_tournage).toISOString())
            .toBe(dateCreneau.toISOString());
    });

    it('rattache le tournage au creneau reserve', async () => {
        const creneau = await Creneau.create({
            date_debut: new Date('2026-10-03T09:00:00.000Z'),
            date_fin: new Date('2026-10-03T11:00:00.000Z')
        });

        const req = creerReq({
            body: { titre: 'Tournage lie', creneau_id: creneau._id.toString() }
        });
        await tournageController.createTournage(req, creerRes());

        const creneauRelu = await Creneau.findById(creneau._id);
        expect(creneauRelu.tournage_id).not.toBeNull();
    });

    it('normalise un statut saisi sans accent par le formulaire', async () => {
        const req = creerReq({ body: { titre: 'Tournage', statut: 'A valider' } });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        expect(statutRenvoye(res)).toBe(201);
        expect(corpsRenvoye(res).statut).toBe('À valider');
    });

    it('accepte les cinq statuts du referentiel, avec ou sans accent', async () => {
        const correspondances = [
            ['A faire', 'À faire'],
            ['En cours', 'En cours'],
            ['A valider', 'À valider'],
            ['Valide', 'Validé'],
            ['Publie', 'Publié']
        ];

        for (const [saisi, attendu] of correspondances) {
            const req = creerReq({ body: { titre: `Tournage ${saisi}`, statut: saisi } });
            const res = creerRes();

            await tournageController.createTournage(req, res);

            expect(statutRenvoye(res)).toBe(201);
            expect(corpsRenvoye(res).statut).toBe(attendu);
        }
    });

    it('refuse un statut absent du referentiel', async () => {
        const req = creerReq({ body: { titre: 'Tournage', statut: 'Archive' } });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Tournage.countDocuments()).toBe(0);
    });

    it('ignore les champs inconnus envoyes par le client', async () => {
        const idInjecte = new mongoose.Types.ObjectId().toString();
        const req = creerReq({
            body: {
                titre: 'Tentative injection',
                _id: idInjecte,
                champInexistant: 'valeur arbitraire'
            }
        });
        const res = creerRes();

        await tournageController.createTournage(req, res);

        const tournage = corpsRenvoye(res);
        expect(tournage._id.toString()).not.toBe(idInjecte);
        expect(tournage.champInexistant).toBeUndefined();
    });
});

describe('getTournages', () => {

    it('renvoie une liste vide quand aucun tournage n existe', async () => {
        const res = creerRes();

        await tournageController.getTournages(creerReq(), res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res)).toEqual([]);
    });

    it('renvoie tous les tournages enregistres', async () => {
        await Tournage.create([{ titre: 'Premier' }, { titre: 'Deuxieme' }]);
        const res = creerRes();

        await tournageController.getTournages(creerReq(), res);

        expect(corpsRenvoye(res)).toHaveLength(2);
    });
});

describe('getTournageById', () => {

    it('renvoie une erreur 404 pour un identifiant inconnu', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await tournageController.getTournageById(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });

    it('renvoie le tournage demande', async () => {
        const cree = await Tournage.create({ titre: 'Vlog campus' });
        const req = creerReq({ params: { id: cree._id.toString() } });
        const res = creerRes();

        await tournageController.getTournageById(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).titre).toBe('Vlog campus');
    });
});

describe('updateTournage', () => {

    it('met a jour les champs transmis', async () => {
        const cree = await Tournage.create({ titre: 'Ancien titre' });
        const req = creerReq({
            params: { id: cree._id.toString() },
            body: { titre: 'Nouveau titre', lieu: 'Studio B' }
        });
        const res = creerRes();

        await tournageController.updateTournage(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).titre).toBe('Nouveau titre');
        expect(corpsRenvoye(res).lieu).toBe('Studio B');
    });

    it('convertit les chaines vides en valeur nulle', async () => {
        const marqueId = new mongoose.Types.ObjectId();
        const cree = await Tournage.create({ titre: 'Avec marque', marque_id: marqueId });

        const req = creerReq({
            params: { id: cree._id.toString() },
            body: { marque_id: '', intervenant_id: '', date_tournage: '' }
        });
        const res = creerRes();

        await tournageController.updateTournage(req, res);

        const tournage = corpsRenvoye(res);
        expect(tournage.marque_id).toBeNull();
        expect(tournage.intervenant_id).toBeNull();
        expect(tournage.date_tournage).toBeNull();
    });

    it('normalise le statut lors d une mise a jour', async () => {
        const cree = await Tournage.create({ titre: 'Tournage' });
        const req = creerReq({
            params: { id: cree._id.toString() },
            body: { statut: 'Publie' }
        });
        const res = creerRes();

        await tournageController.updateTournage(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).statut).toBe('Publié');
    });

    it('refuse une mise a jour vers un statut invalide', async () => {
        const cree = await Tournage.create({ titre: 'Tournage' });
        const req = creerReq({
            params: { id: cree._id.toString() },
            body: { statut: 'Archive' }
        });
        const res = creerRes();

        await tournageController.updateTournage(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('renvoie une erreur 404 si le tournage n existe pas', async () => {
        const req = creerReq({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { titre: 'Peu importe' }
        });
        const res = creerRes();

        await tournageController.updateTournage(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});

describe('deleteTournage', () => {

    it('supprime le tournage demande', async () => {
        const cree = await Tournage.create({ titre: 'A supprimer' });
        const req = creerReq({ params: { id: cree._id.toString() } });
        const res = creerRes();

        await tournageController.deleteTournage(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(await Tournage.countDocuments()).toBe(0);
    });

    it('delie le creneau associe lors de la suppression', async () => {
        const creneau = await Creneau.create({
            date_debut: new Date('2026-10-04T09:00:00.000Z'),
            date_fin: new Date('2026-10-04T11:00:00.000Z')
        });
        const tournage = await Tournage.create({ titre: 'Avec creneau', creneau_id: creneau._id });
        await Creneau.findByIdAndUpdate(creneau._id, { tournage_id: tournage._id });

        const req = creerReq({ params: { id: tournage._id.toString() } });
        await tournageController.deleteTournage(req, creerRes());

        const creneauRelu = await Creneau.findById(creneau._id);
        expect(creneauRelu.tournage_id).toBeNull();
    });

    it('renvoie une erreur 404 si le tournage n existe pas', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await tournageController.deleteTournage(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});