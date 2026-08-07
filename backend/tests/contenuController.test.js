/**
 * Tests du controleur Contenu.
 *
 * Ces tests decrivent le comportement reel du code actuel :
 *   - referentiel accentue partage avec Tournage
 *   - transitions du workflow validees cote serveur
 *   - repercussion du statut du contenu sur son tournage parent
 */

const mongoose = require('mongoose');
const Contenu = require('../models/Contenu');
const Tournage = require('../models/Tournage');
const contenuController = require('../controllers/contenuController');
const { creerRes, creerReq, statutRenvoye, corpsRenvoye } = require('./helpers');

// Cree un tournage de test et renvoie son identifiant sous forme de chaine.
const creerTournage = async (titre = 'Tournage de test') => {
    const tournage = await Tournage.create({ titre });
    return tournage._id.toString();
};

// Cree un contenu rattache a un tournage, en passant par le controleur.
const creerContenu = async (tournageId, titre, statut = 'À faire') => {
    const req = creerReq({
        body: { titre, tournage_id: tournageId, statut_workflow: statut }
    });
    const res = creerRes();
    await contenuController.createContenu(req, res);
    return corpsRenvoye(res);
};

// Relit le statut du tournage directement en base.
const statutDuTournage = async (tournageId) => {
    const tournage = await Tournage.findById(tournageId);
    return tournage.statut;
};

describe('createContenu', () => {

    it('cree un contenu au statut initial du workflow', async () => {
        const tournageId = await creerTournage();
        const req = creerReq({ body: { titre: 'Reel Instagram', tournage_id: tournageId } });
        const res = creerRes();

        await contenuController.createContenu(req, res);

        expect(statutRenvoye(res)).toBe(201);
        expect(corpsRenvoye(res).statut_workflow).toBe('À faire');
    });

    it('normalise un statut saisi sans accent', async () => {
        const tournageId = await creerTournage();
        const req = creerReq({
            body: { titre: 'Carrousel', tournage_id: tournageId, statut_workflow: 'a valider' }
        });
        const res = creerRes();

        await contenuController.createContenu(req, res);

        expect(corpsRenvoye(res).statut_workflow).toBe('À valider');
    });

    it('refuse un contenu sans tournage rattache', async () => {
        const req = creerReq({ body: { titre: 'Contenu orphelin' } });
        const res = creerRes();

        await contenuController.createContenu(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Contenu.countDocuments()).toBe(0);
    });

    it('refuse un contenu sans titre', async () => {
        const tournageId = await creerTournage();
        const req = creerReq({ body: { tournage_id: tournageId } });
        const res = creerRes();

        await contenuController.createContenu(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('refuse un statut absent du referentiel', async () => {
        const tournageId = await creerTournage();
        const req = creerReq({
            body: { titre: 'Contenu', tournage_id: tournageId, statut_workflow: 'Archive' }
        });
        const res = creerRes();

        await contenuController.createContenu(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('repercute le statut du contenu sur son tournage parent', async () => {
        const tournageId = await creerTournage();

        await creerContenu(tournageId, 'Video', 'En cours');

        expect(await statutDuTournage(tournageId)).toBe('En cours');
    });
});

describe('updateStatutContenu — transitions du workflow', () => {

    it('autorise le passage de "A faire" a "En cours"', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { nouveauStatut: 'En cours' }
        });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).statut_workflow).toBe('En cours');
    });

    it('refuse un saut d etape de "A faire" vers "Publie"', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { nouveauStatut: 'Publié' }
        });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(corpsRenvoye(res).message).toContain('Transition non autorisée');

        // Le statut ne doit pas avoir bouge en base.
        const enBase = await Contenu.findById(contenu._id);
        expect(enBase.statut_workflow).toBe('À faire');
    });

    it('autorise le retour en arriere apres un rejet', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video', 'À valider');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { nouveauStatut: 'En cours' }
        });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).statut_workflow).toBe('En cours');
    });

    it('accepte la variante snake_case du parametre', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { nouveau_statut: 'En cours' }
        });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(statutRenvoye(res)).toBe(200);
    });

    it('normalise un statut transmis sans accent', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { nouveauStatut: 'en cours' }
        });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(corpsRenvoye(res).statut_workflow).toBe('En cours');
    });

    it('refuse une requete sans nouveau statut', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        const req = creerReq({ params: { id: contenu._id.toString() }, body: {} });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(statutRenvoye(res)).toBe(400);
    });

    it('renvoie une erreur 404 si le contenu n existe pas', async () => {
        const req = creerReq({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { nouveauStatut: 'En cours' }
        });
        const res = creerRes();

        await contenuController.updateStatutContenu(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });

    it('parcourt tout le workflow sans erreur', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        for (const etape of ['En cours', 'À valider', 'Validé', 'Publié']) {
            const req = creerReq({
                params: { id: contenu._id.toString() },
                body: { nouveauStatut: etape }
            });
            const res = creerRes();

            await contenuController.updateStatutContenu(req, res);

            expect(statutRenvoye(res)).toBe(200);
            expect(corpsRenvoye(res).statut_workflow).toBe(etape);
        }
    });

    it('fait avancer le tournage parent en meme temps que le contenu', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Video');

        expect(await statutDuTournage(tournageId)).toBe('À faire');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { nouveauStatut: 'En cours' }
        });
        await contenuController.updateStatutContenu(req, creerRes());

        expect(await statutDuTournage(tournageId)).toBe('En cours');
    });
});

describe('updateContenu', () => {

    it('met a jour les champs transmis', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'Ancien titre');

        const req = creerReq({
            params: { id: contenu._id.toString() },
            body: { titre: 'Nouveau titre', pilier: 'Inspiration' }
        });
        const res = creerRes();

        await contenuController.updateContenu(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).titre).toBe('Nouveau titre');
        expect(corpsRenvoye(res).pilier).toBe('Inspiration');
    });

    it('renvoie une erreur 404 si le contenu n existe pas', async () => {
        const req = creerReq({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { titre: 'Peu importe' }
        });
        const res = creerRes();

        await contenuController.updateContenu(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});

describe('getContenus', () => {

    it('renvoie une liste vide quand aucun contenu n existe', async () => {
        const res = creerRes();

        await contenuController.getContenus(creerReq(), res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res)).toEqual([]);
    });

    it('renvoie tous les contenus enregistres', async () => {
        const tournageId = await creerTournage();
        await creerContenu(tournageId, 'Premier');
        await creerContenu(tournageId, 'Deuxieme');

        const res = creerRes();
        await contenuController.getContenus(creerReq(), res);

        expect(corpsRenvoye(res)).toHaveLength(2);
    });
});

describe('deleteContenu', () => {

    it('supprime le contenu demande', async () => {
        const tournageId = await creerTournage();
        const contenu = await creerContenu(tournageId, 'A supprimer');

        const req = creerReq({ params: { id: contenu._id.toString() } });
        const res = creerRes();

        await contenuController.deleteContenu(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(await Contenu.countDocuments()).toBe(0);
    });

    it('renvoie une erreur 404 si le contenu n existe pas', async () => {
        const req = creerReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
        const res = creerRes();

        await contenuController.deleteContenu(req, res);

        expect(statutRenvoye(res)).toBe(404);
    });
});