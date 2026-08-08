/**
 * Preparation de l'environnement de test.
 *
 * Les tests se connectent au MongoDB deja disponible (celui du conteneur
 * Docker, expose sur le port 27017), mais sur une base DISTINCTE nommee
 * "managerhub_test". La base de developpement "managerhub" n'est jamais
 * touchee.
 *
 * Un garde-fou verifie que le nom de la base contient bien "test" avant
 * d'autoriser la moindre suppression : si la configuration pointait par
 * erreur sur la base de developpement, les tests refuseraient de demarrer.
 *
 * Prerequis : le conteneur MongoDB doit tourner.
 *   docker compose up -d mongo
 */

const mongoose = require('mongoose');

// Variables d'environnement necessaires aux tests.
// Le fichier .env n'est pas charge ici : on fournit des valeurs dediees,
// distinctes de celles de production, pour que les tests soient reproductibles
// sur n'importe quelle machine.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret_de_test_managerhub';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Les modeles doivent etre enregistres aupres de Mongoose avant que les
// controleurs n'utilisent .populate(), sinon Mongoose leve une MissingSchemaError.
require('../models/Utilisateur');
require('../models/Marque');
require('../models/Intervenant');
require('../models/Creneau');
require('../models/Tournage');
require('../models/Contenu');
require('../models/Campagne');
require('../models/Equipe');

// Jest execute les fichiers de test en parallele, dans plusieurs processus.
// Si tous partagent la meme base, le nettoyage effectue par l'un efface les
// donnees d'un autre en pleine execution. On donne donc a chaque processus sa
// propre base, identifiee par son numero (JEST_WORKER_ID vaut 1, 2, 3...).
const NUMERO_PROCESSUS = process.env.JEST_WORKER_ID || '1';

const URI_TEST = process.env.MONGO_URI_TEST
    || `mongodb://localhost:27017/managerhub_test_${NUMERO_PROCESSUS}`;

// Garde-fou : on refuse de travailler sur autre chose qu'une base de test.
if (!/test/i.test(URI_TEST)) {
    throw new Error(
        `Refus de lancer les tests : la base "${URI_TEST}" ne semble pas etre une base de test. ` +
        'Son nom doit contenir "test".'
    );
}

beforeAll(async () => {
    try {
        await mongoose.connect(URI_TEST, {
            serverSelectionTimeoutMS: 5000,
            // Les tests s'executent sequentiellement : une poignee de
            // connexions suffit. Un pool trop large ralentit l'acces au
            // conteneur Docker sans rien apporter.
            maxPoolSize: 5
        });
    } catch (erreur) {
        throw new Error(
            `Impossible de se connecter a ${URI_TEST}.\n` +
            'Verifier que le conteneur MongoDB tourne : docker compose up -d mongo\n' +
            `Detail : ${erreur.message}`
        );
    }
});

// Apres chaque test : on vide toutes les collections.
// C'est ce qui garantit qu'un test ne depend pas de ce qu'un autre a laisse.
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const nom of Object.keys(collections)) {
        await collections[nom].deleteMany({});
    }
});

// A la fin de la suite : on supprime entierement la base de test et on ferme.
afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
});