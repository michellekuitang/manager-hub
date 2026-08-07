/**
 * Petits utilitaires partages par les tests.
 *
 * Un controleur Express est une fonction (req, res). Pour le tester sans lancer
 * de serveur HTTP, on lui fournit de faux objets req et res. Le faux res
 * enregistre ce que le controleur lui demande d'envoyer, ce qui permet ensuite
 * de verifier le code de statut et le corps de la reponse.
 */

const mongoose = require('mongoose');

// Faux objet res : chaque methode retourne res pour permettre le chainage
// res.status(...).json(...), exactement comme le vrai objet d'Express.
const creerRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Faux objet req. Le middleware auth.js place req.user = { userId, role } :
// on reproduit la meme structure pour que les controleurs fonctionnent.
const creerReq = ({ body = {}, params = {}, query = {}, user = null } = {}) => ({
    body,
    params,
    query,
    user: user || { userId: new mongoose.Types.ObjectId().toString(), role: 'admin' }
});

// Raccourcis de lecture de ce que le controleur a renvoye.
const statutRenvoye = (res) => res.status.mock.calls[0][0];
const corpsRenvoye = (res) => res.json.mock.calls[0][0];

module.exports = { creerRes, creerReq, statutRenvoye, corpsRenvoye };