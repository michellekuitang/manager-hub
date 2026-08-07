/**
 * Tests du middleware d'authentification.
 *
 * Le middleware protege toutes les routes de l'application sauf /api/auth.
 * Ces tests verifient qu'aucune requete ne passe sans jeton valide, et que
 * req.user est bien renseigne pour les controleurs situes en aval.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { creerRes, statutRenvoye, corpsRenvoye } = require('./helpers');

// Faux objet req exposant la methode header() utilisee par le middleware.
const creerRequete = (enteteAuthorization) => ({
    header: (nom) => (nom === 'Authorization' ? enteteAuthorization : undefined)
});

const signerJeton = (charge, options = {}) =>
    jwt.sign(charge, process.env.JWT_SECRET, { expiresIn: '8h', ...options });

describe('middleware auth', () => {

    it('refuse une requete sans en-tete Authorization', () => {
        const req = creerRequete(undefined);
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(statutRenvoye(res)).toBe(401);
        expect(suivant).not.toHaveBeenCalled();
    });

    it('refuse une requete dont le jeton est vide', () => {
        const req = creerRequete('Bearer ');
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(statutRenvoye(res)).toBe(401);
        expect(suivant).not.toHaveBeenCalled();
    });

    it('refuse un jeton qui n est pas un JWT', () => {
        const req = creerRequete('Bearer ceci-nest-pas-un-jeton');
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(statutRenvoye(res)).toBe(401);
        expect(suivant).not.toHaveBeenCalled();
    });

    it('refuse un jeton signe avec une autre cle', () => {
        const jetonEtranger = jwt.sign({ userId: '123', role: 'admin' }, 'cle_dun_attaquant');
        const req = creerRequete(`Bearer ${jetonEtranger}`);
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(statutRenvoye(res)).toBe(401);
        expect(suivant).not.toHaveBeenCalled();
    });

    it('refuse un jeton expire', () => {
        const jetonExpire = signerJeton({ userId: '123', role: 'user' }, { expiresIn: '-1s' });
        const req = creerRequete(`Bearer ${jetonExpire}`);
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(statutRenvoye(res)).toBe(401);
        expect(corpsRenvoye(res).message).toContain('Token invalide ou expire');
        expect(suivant).not.toHaveBeenCalled();
    });

    it('refuse un jeton dont la charge a ete modifiee', () => {
        const jetonValide = signerJeton({ userId: '123', role: 'user' });
        const [entete, charge, signature] = jetonValide.split('.');

        // On remplace la charge par une version ou le role devient admin,
        // en conservant la signature d'origine.
        const chargeModifiee = Buffer
            .from(JSON.stringify({ userId: '123', role: 'admin' }))
            .toString('base64url');
        const jetonFalsifie = `${entete}.${chargeModifiee}.${signature}`;

        const req = creerRequete(`Bearer ${jetonFalsifie}`);
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(statutRenvoye(res)).toBe(401);
        expect(suivant).not.toHaveBeenCalled();
    });

    it('laisse passer une requete munie d un jeton valide', () => {
        const jeton = signerJeton({ userId: '123', role: 'user' });
        const req = creerRequete(`Bearer ${jeton}`);
        const res = creerRes();
        const suivant = jest.fn();

        auth(req, res, suivant);

        expect(suivant).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('renseigne req.user avec userId et role', () => {
        const identifiant = new mongoose.Types.ObjectId().toString();
        const jeton = signerJeton({ userId: identifiant, role: 'admin' });
        const req = creerRequete(`Bearer ${jeton}`);
        const suivant = jest.fn();

        auth(req, creerRes(), suivant);

        expect(req.user.userId).toBe(identifiant);
        expect(req.user.role).toBe('admin');
    });
});