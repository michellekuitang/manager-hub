/**
 * Tests du controleur d'authentification.
 *
 * Ces tests couvrent la partie la plus sensible de l'application : la creation
 * de compte et la connexion. Ils verifient notamment que le mot de passe n'est
 * jamais stocke en clair, que le jeton JWT contient les bonnes informations, et
 * qu'une tentative de connexion echouee ne revele pas si l'email existe.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');
const authController = require('../controllers/authController');
const { creerRes, creerReq, statutRenvoye, corpsRenvoye } = require('./helpers');

// Jeu de donnees reutilise dans plusieurs tests.
const COMPTE = {
    nom: 'Kuitang',
    prenom: 'Michelle',
    email: 'michelle@esiia.fr',
    mot_de_passe: 'MotDePasse123'
};

// Cree un compte directement en base, sans passer par le controleur.
const creerCompte = async (donnees = {}) => {
    const { mot_de_passe = COMPTE.mot_de_passe, ...reste } = { ...COMPTE, ...donnees };
    return Utilisateur.create({
        nom: reste.nom,
        prenom: reste.prenom,
        email: reste.email,
        mot_de_passe_hash: await bcrypt.hash(mot_de_passe, 10),
        ...(reste.role ? { role: reste.role } : {})
    });
};

describe('register', () => {

    it('cree un compte et renvoie un statut 201', async () => {
        const req = creerReq({ body: COMPTE });
        const res = creerRes();

        await authController.register(req, res);

        expect(statutRenvoye(res)).toBe(201);
        expect(await Utilisateur.countDocuments()).toBe(1);
    });

    it('ne stocke jamais le mot de passe en clair', async () => {
        const req = creerReq({ body: COMPTE });
        await authController.register(req, creerRes());

        const utilisateur = await Utilisateur.findOne({ email: COMPTE.email });

        expect(utilisateur.mot_de_passe_hash).not.toBe(COMPTE.mot_de_passe);
        expect(utilisateur.mot_de_passe_hash).toMatch(/^\$2[aby]\$/); // signature bcrypt
        expect(utilisateur.mot_de_passe).toBeUndefined();
    });

    it('produit un hash verifiable par bcrypt', async () => {
        const req = creerReq({ body: COMPTE });
        await authController.register(req, creerRes());

        const utilisateur = await Utilisateur.findOne({ email: COMPTE.email });
        const correspond = await bcrypt.compare(COMPTE.mot_de_passe, utilisateur.mot_de_passe_hash);

        expect(correspond).toBe(true);
    });

    it('ne renvoie jamais le hash dans la reponse', async () => {
        const req = creerReq({ body: COMPTE });
        const res = creerRes();

        await authController.register(req, res);

        expect(JSON.stringify(corpsRenvoye(res))).not.toContain('$2');
    });

    it('refuse un email deja utilise', async () => {
        await creerCompte();

        const req = creerReq({ body: COMPTE });
        const res = creerRes();

        await authController.register(req, res);

        expect(statutRenvoye(res)).toBe(400);
        expect(await Utilisateur.countDocuments()).toBe(1);
    });

    it('attribue le role "user" par defaut', async () => {
        const req = creerReq({ body: COMPTE });
        await authController.register(req, creerRes());

        const utilisateur = await Utilisateur.findOne({ email: COMPTE.email });
        expect(utilisateur.role).toBe('user');
    });

    it('ignore un role transmis par le client', async () => {
        const req = creerReq({ body: { ...COMPTE, role: 'admin' } });
        await authController.register(req, creerRes());

        const utilisateur = await Utilisateur.findOne({ email: COMPTE.email });
        expect(utilisateur.role).toBe('user');
    });

    it('renvoie une erreur si le mot de passe est absent', async () => {
        const { mot_de_passe, ...sansMotDePasse } = COMPTE;
        const req = creerReq({ body: sansMotDePasse });
        const res = creerRes();

        await authController.register(req, res);

        expect(statutRenvoye(res)).toBe(500);
        expect(await Utilisateur.countDocuments()).toBe(0);
    });
});

describe('login', () => {

    it('renvoie un jeton pour des identifiants valides', async () => {
        await creerCompte();

        const req = creerReq({ body: { email: COMPTE.email, mot_de_passe: COMPTE.mot_de_passe } });
        const res = creerRes();

        await authController.login(req, res);

        expect(statutRenvoye(res)).toBe(200);
        expect(corpsRenvoye(res).token).toEqual(expect.any(String));
    });

    it('place userId et role dans le jeton', async () => {
        const utilisateur = await creerCompte();

        const req = creerReq({ body: { email: COMPTE.email, mot_de_passe: COMPTE.mot_de_passe } });
        const res = creerRes();

        await authController.login(req, res);

        const contenu = jwt.verify(corpsRenvoye(res).token, process.env.JWT_SECRET);

        expect(contenu.userId).toBe(utilisateur._id.toString());
        expect(contenu.role).toBe('user');
    });

    it('produit un jeton dont la date d expiration est posterieure a l emission', async () => {
        await creerCompte();

        const req = creerReq({ body: { email: COMPTE.email, mot_de_passe: COMPTE.mot_de_passe } });
        const res = creerRes();

        await authController.login(req, res);

        const contenu = jwt.verify(corpsRenvoye(res).token, process.env.JWT_SECRET);

        expect(contenu.exp).toBeGreaterThan(contenu.iat);
    });

    it('ne renvoie jamais le hash du mot de passe', async () => {
        await creerCompte();

        const req = creerReq({ body: { email: COMPTE.email, mot_de_passe: COMPTE.mot_de_passe } });
        const res = creerRes();

        await authController.login(req, res);

        const corps = corpsRenvoye(res);
        expect(corps.utilisateur.mot_de_passe_hash).toBeUndefined();
        expect(JSON.stringify(corps.utilisateur)).not.toContain('$2');
    });

    it('refuse un mot de passe incorrect', async () => {
        await creerCompte();

        const req = creerReq({ body: { email: COMPTE.email, mot_de_passe: 'MauvaisMotDePasse' } });
        const res = creerRes();

        await authController.login(req, res);

        expect(statutRenvoye(res)).toBe(401);
        expect(corpsRenvoye(res).token).toBeUndefined();
    });

    it('refuse un email inconnu', async () => {
        const req = creerReq({ body: { email: 'inconnu@esiia.fr', mot_de_passe: COMPTE.mot_de_passe } });
        const res = creerRes();

        await authController.login(req, res);

        expect(statutRenvoye(res)).toBe(401);
    });

    it('renvoie le meme message pour un email inconnu et un mot de passe faux', async () => {
        await creerCompte();

        const resEmailInconnu = creerRes();
        await authController.login(
            creerReq({ body: { email: 'inconnu@esiia.fr', mot_de_passe: COMPTE.mot_de_passe } }),
            resEmailInconnu
        );

        const resMotDePasseFaux = creerRes();
        await authController.login(
            creerReq({ body: { email: COMPTE.email, mot_de_passe: 'MauvaisMotDePasse' } }),
            resMotDePasseFaux
        );

        // Un message different permettrait de deviner quels emails existent.
        expect(corpsRenvoye(resEmailInconnu).message)
            .toBe(corpsRenvoye(resMotDePasseFaux).message);
    });
});