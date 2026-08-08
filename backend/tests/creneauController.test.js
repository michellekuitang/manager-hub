/**
 * Tests du controleur Creneau.
 *
 * Le creneau porte la liaison entre le planning et les tournages. Ces tests
 * verifient le cycle de vie complet d'un creneau ainsi que sa liaison avec un
 * intervenant et un tournage.
 *
 * Une limite connue est documentee telle qu'elle existe : aucun controle de
 * chevauchement n'empeche deux creneaux simultanes pour un meme intervenant.
 * Un test qui documente une limite vaut mieux qu'une limite non testee : le
 * jour ou la regle est ajoutee, le test le signale.
 */

const mongoose = require('mongoose');
const Creneau = require('../models/Creneau');
const Tournage = require('../models/Tournage');
const Intervenant = require('../models/Intervenant');
const creneauController = require('../controllers/creneauController');
const { creerRes, creerReq, statutRenvoye, corpsRenvoye } = require('./helpers');

const DEBUT = new Date('2026-09-15T09:00:00.000Z');
const FIN = new Date('2026-09-15T11:00:00.000Z');

describe('createCreneau', () => {

    it('cree un creneau avec les dates transmises', async () => {
        const req = creerReq({ body: { date_debut: DEBUT, date_fin: FIN, objet: 'Tournage JPO' } });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        expect(statutRenvoye(res)).toBe(201);
        expect(corpsRenvoye(res).objet).toBe('Tournage JPO');
        expect(await Creneau.countDocuments()).toBe(1);
    });

    it('applique le statut "Disponible" par defaut', async () => {
        const req = creerReq({ body: { date_debut: DEBUT, date_fin: FIN } });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        // Un creneau nouvellement cree, sans tournage rattache, est libre.
        expect(corpsRenvoye(res).statut).toBe('Disponible');
    });

    it('accepte le statut "Reserve"', async () => {
        const req = creerReq({ body: { date_debut: DEBUT, date_fin: FIN, statut: 'Reserve' } });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        expect(statutRenvoye(res)).toBe(201);
        expect(corpsRenvoye(res).statut).toBe('Reserve');
    });

    it('refuse un statut absent du referentiel', async () => {
        const req = creerReq({ body: { date_debut: DEBUT, date_fin: FIN, statut: 'Annule' } });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        // L'erreur vient de la donnee envoyee, pas du serveur : code 400.
        expect(statutRenvoye(res)).toBe(400);
        expect(await Creneau.countDocuments()).toBe(0);
    });

    it('refuse un creneau sans date de debut', async () => {
        const req = creerReq({ body: { date_fin: FIN } });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Creneau.countDocuments()).toBe(0);
    });

    it('refuse un creneau sans date de fin', async () => {
        const req = creerReq({ body: { date_debut: DEBUT } });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('renvoie l intervenant et le tournage lies', async () => {
        const intervenant = await Intervenant.create({ nom: 'JEAN', prenom: 'pierre' });
        const tournage = await Tournage.create({ titre: 'JPO' });

        const req = creerReq({
            body: {
                date_debut: DEBUT,
                date_fin: FIN,
                intervenant_id: intervenant._id.toString(),
                tournage_id: tournage._id.toString()
            }
        });
        const res = creerRes();

        await creneauController.createCreneau(req, res);

        const creneau = corpsRenvoye(res);
        expect(creneau.intervenant_id.nom).toBe('JEAN');
        expect(creneau.tournage_id.titre).toBe('JPO');
    });

    it('n empeche pas deux creneaux sur le meme horaire', async () => {
        const intervenant = await Intervenant.create({ nom: 'JEAN', prenom: 'pierre' });
        const corps = {
            date_debut: DEBUT,
            date_fin: FIN,
            intervenant_id: intervenant._id.toString()
        };

        await creneauController.createCreneau(creerReq({ body: corps }), creerRes());
        await creneauController.createCreneau(creerReq({ body: corps }), creerRes());

        // Comportement actuel : aucun controle de chevauchement n'est effectue.
        // Ce test documente la limite ; il devra etre inverse si la regle
        // "un intervenant ne peut pas etre sur deux tournages en meme temps"
        // est implementee un jour.
        expect(await Creneau.countDocuments()).toBe(2);
    });
});

describe('getCreneaux', () => {

    it('renvoie une liste vide quand aucun creneau n existe', async () => {
        const res = creerRes();

        await creneauController.getCreneaux(creerReq(), res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res)).toEqual([]);
    });

    it('renvoie tous les creneaux enregistres', async () => {
        await Creneau.create([
            { date_debut: DEBUT, date_fin: FIN },
            { date_debut: new Date('2026-09-16T09:00:00.000Z'), date_fin: new Date('2026-09-16T11:00:00.000Z') }
        ]);
        const res = creerRes();

        await creneauController.getCreneaux(creerReq(), res);

        expect(corpsRenvoye(res)).toHaveLength(2);
    });

    it('trie les creneaux du plus proche au plus lointain', async () => {
        await Creneau.create([
            { date_debut: new Date('2026-09-20T09:00:00.000Z'), date_fin: new Date('2026-09-20T11:00:00.000Z'), objet: 'Plus tard' },
            { date_debut: DEBUT, date_fin: FIN, objet: 'Plus tot' }
        ]);
        const res = creerRes();

        await creneauController.getCreneaux(creerReq(), res);

        expect(corpsRenvoye(res)[0].objet).toBe('Plus tot');
    });
});

describe('updateCreneau', () => {

    it('modifie les champs transmis', async () => {
        const creneau = await Creneau.create({ date_debut: DEBUT, date_fin: FIN, objet: 'Ancien objet' });
        const req = creerReq({
            params: { id: creneau._id.toString() },
            body: { objet: 'Nouvel objet' }
        });
        const res = creerRes();

        await creneauController.updateCreneau(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).objet).toBe('Nouvel objet');
    });

    it('rattache un tournage a un creneau existant', async () => {
        const creneau = await Creneau.create({ date_debut: DEBUT, date_fin: FIN, statut: 'Disponible' });
        const tournage = await Tournage.create({ titre: 'Interview' });

        const req = creerReq({
            params: { id: creneau._id.toString() },
            body: { tournage_id: tournage._id.toString(), statut: 'Reserve' }
        });
        const res = creerRes();

        await creneauController.updateCreneau(req, res);

        const modifie = corpsRenvoye(res);
        expect(modifie.tournage_id.titre).toBe('Interview');
        expect(modifie.statut).toBe('Reserve');
    });

    it('libere un creneau en retirant son tournage', async () => {
        const tournage = await Tournage.create({ titre: 'Annule' });
        const creneau = await Creneau.create({
            date_debut: DEBUT,
            date_fin: FIN,
            tournage_id: tournage._id,
            statut: 'Reserve'
        });

        const req = creerReq({
            params: { id: creneau._id.toString() },
            body: { tournage_id: null, statut: 'Disponible' }
        });
        const res = creerRes();

        await creneauController.updateCreneau(req, res);

        expect(corpsRenvoye(res).tournage_id).toBeNull();
        expect(corpsRenvoye(res).statut).toBe('Disponible');
    });

    it('refuse une mise a jour vers un statut invalide', async () => {
        const creneau = await Creneau.create({ date_debut: DEBUT, date_fin: FIN });

        const req = creerReq({
            params: { id: creneau._id.toString() },
            body: { statut: 'Annule' }
        });
        const res = creerRes();

        await creneauController.updateCreneau(req, res);

        // runValidators est active : l'enum est verifie aussi a la mise a jour.
        expect(statutRenvoye(res)).toBe(400);
    });

    it('renvoie une erreur 404 si le creneau n existe pas', async () => {
        const req = creerReq({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { objet: 'Peu importe' }
        });
        const res = creerRes();

        await creneauController.updateCreneau(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});

describe('deleteCreneau', () => {

    it('supprime le creneau demande', async () => {
        const creneau = await Creneau.create({ date_debut: DEBUT, date_fin: FIN });
        const req = creerReq({ params: { id: creneau._id.toString() } });
        const res = creerRes();

        await creneauController.deleteCreneau(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(await Creneau.countDocuments()).toBe(0);
    });

    it('renvoie une erreur 404 si le creneau n existe pas', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await creneauController.deleteCreneau(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});