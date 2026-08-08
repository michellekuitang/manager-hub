/**
 * Tests du controleur Equipe.
 *
 * La collection Equipe recense les membres du service marketing (photographe,
 * cadreur, community manager). Elle est distincte de la collection Utilisateur,
 * qui porte les comptes de connexion a l'application.
 *
 * Les tests verifient notamment qu'aucune donnee d'authentification ne circule
 * par ce controleur, et que l'unicite des adresses e-mail est respectee.
 */

const mongoose = require('mongoose');
const Equipe = require('../models/Equipe');
const Marque = require('../models/Marque');
const equipeController = require('../controllers/equipeController');
const { creerRes, creerReq, statutRenvoye, corpsRenvoye } = require('./helpers');

const MEMBRE = {
    nom: 'Glorie',
    prenom: 'Therese',
    email: 'therese.glorie@esiia.fr',
    telephone: '0612345678'
};

describe('createMembre', () => {

    it('cree un membre et applique les valeurs par defaut', async () => {
        const req = creerReq({ body: MEMBRE });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        expect(statutRenvoye(res)).toBe(201);

        const membre = corpsRenvoye(res);
        expect(membre.nom).toBe('Glorie');
        expect(membre.role).toBe('Photographe');
        expect(membre.actif).toBe(true);
    });

    it('accepte un role libre', async () => {
        const req = creerReq({ body: { ...MEMBRE, role: 'Community Manager' } });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        // Le champ role est un intitule de poste, pas une permission :
        // il n'est volontairement pas contraint par un enum.
        expect(corpsRenvoye(res).role).toBe('Community Manager');
    });

    it('normalise l adresse e-mail en minuscules', async () => {
        const req = creerReq({ body: { ...MEMBRE, email: 'THERESE.GLORIE@ESIIA.FR' } });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        expect(corpsRenvoye(res).email).toBe('therese.glorie@esiia.fr');
    });

    it('supprime les espaces autour des champs texte', async () => {
        const req = creerReq({ body: { ...MEMBRE, nom: '  Glorie  ', prenom: '  Therese  ' } });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        const membre = corpsRenvoye(res);
        expect(membre.nom).toBe('Glorie');
        expect(membre.prenom).toBe('Therese');
    });

    it('refuse un e-mail deja utilise', async () => {
        await Equipe.create(MEMBRE);

        const req = creerReq({ body: { ...MEMBRE, prenom: 'Autre' } });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Equipe.countDocuments()).toBe(1);
    });

    it('refuse un membre sans nom', async () => {
        const { nom, ...sansNom } = MEMBRE;
        const req = creerReq({ body: sansNom });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        // L'erreur vient de la donnee envoyee, pas du serveur : code 400.
        expect(statutRenvoye(res)).toBe(400);
        expect(await Equipe.countDocuments()).toBe(0);
    });

    it('refuse un membre sans adresse e-mail', async () => {
        const { email, ...sansEmail } = MEMBRE;
        const req = creerReq({ body: sansEmail });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('ne renvoie aucune donnee d authentification', async () => {
        const req = creerReq({ body: { ...MEMBRE, mot_de_passe: 'TentativeInjection' } });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        const membre = corpsRenvoye(res);
        expect(membre.mot_de_passe).toBeUndefined();
        expect(membre.mot_de_passe_hash).toBeUndefined();
        expect(JSON.stringify(membre)).not.toContain('TentativeInjection');
    });

    it('rattache le membre a une marque', async () => {
        const marque = await Marque.create({ nom: 'ESIIA' });

        const req = creerReq({ body: { ...MEMBRE, marque: marque._id.toString() } });
        const res = creerRes();

        await equipeController.createMembre(req, res);

        expect(corpsRenvoye(res).marque.toString()).toBe(marque._id.toString());
    });
});

describe('getMembres', () => {

    it('renvoie une liste vide quand l equipe est vide', async () => {
        const res = creerRes();

        await equipeController.getMembres(creerReq(), res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res)).toEqual([]);
    });

    it('renvoie tous les membres avec le nom de leur marque', async () => {
        const marque = await Marque.create({ nom: 'ESUV' });
        await Equipe.create({ ...MEMBRE, marque: marque._id });

        const res = creerRes();
        await equipeController.getMembres(creerReq(), res);

        const membres = corpsRenvoye(res);
        expect(membres).toHaveLength(1);
        expect(membres[0].marque.nom).toBe('ESUV');
    });

    it('renvoie les membres du plus recent au plus ancien', async () => {
        const premier = await Equipe.create({ ...MEMBRE, email: 'premier@esiia.fr' });
        const second = await Equipe.create({ ...MEMBRE, email: 'second@esiia.fr' });

        // Dates forcees en base pour rendre le tri verifiable.
        await Equipe.collection.updateOne(
            { _id: premier._id },
            { $set: { createdAt: new Date('2026-01-15T10:00:00.000Z') } }
        );
        await Equipe.collection.updateOne(
            { _id: second._id },
            { $set: { createdAt: new Date('2026-06-15T10:00:00.000Z') } }
        );

        const res = creerRes();
        await equipeController.getMembres(creerReq(), res);

        expect(corpsRenvoye(res)[0].email).toBe('second@esiia.fr');
    });
});

describe('updateMembre', () => {

    it('modifie les champs transmis', async () => {
        const membre = await Equipe.create(MEMBRE);

        const req = creerReq({
            params: { id: membre._id.toString() },
            body: { ...MEMBRE, role: 'Cadreur', telephone: '0698765432' }
        });
        const res = creerRes();

        await equipeController.updateMembre(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).role).toBe('Cadreur');
        expect(corpsRenvoye(res).telephone).toBe('0698765432');
    });

    it('desactive un membre sans le supprimer', async () => {
        const membre = await Equipe.create(MEMBRE);

        const req = creerReq({
            params: { id: membre._id.toString() },
            body: { ...MEMBRE, actif: false }
        });
        const res = creerRes();

        await equipeController.updateMembre(req, res);

        expect(corpsRenvoye(res).actif).toBe(false);
        expect(await Equipe.countDocuments()).toBe(1);
    });

    it('conserve les champs non transmis', async () => {
        const membre = await Equipe.create({ ...MEMBRE, role: 'Cadreur' });

        const req = creerReq({
            params: { id: membre._id.toString() },
            body: { telephone: '0700000000' }
        });
        const res = creerRes();

        await equipeController.updateMembre(req, res);

        const modifie = corpsRenvoye(res);
        expect(modifie.telephone).toBe('0700000000');
        expect(modifie.nom).toBe('Glorie');
        expect(modifie.role).toBe('Cadreur');
    });

    it('renvoie une erreur 404 si le membre n existe pas', async () => {
        const req = creerReq({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { ...MEMBRE }
        });
        const res = creerRes();

        await equipeController.updateMembre(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});

describe('deleteMembre', () => {

    it('supprime le membre demande', async () => {
        const membre = await Equipe.create(MEMBRE);

        const req = creerReq({ params: { id: membre._id.toString() } });
        const res = creerRes();

        await equipeController.deleteMembre(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(await Equipe.countDocuments()).toBe(0);
    });

    it('renvoie une erreur 404 si le membre n existe pas', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await equipeController.deleteMembre(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});