/**
 * Configuration Jest — a placer a la racine du dossier backend/
 */
module.exports = {
    // Environnement Node (et non navigateur) : on teste du code serveur.
    testEnvironment: 'node',

    // Fichier execute avant chaque suite de tests : il demarre la base en memoire.
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Ou chercher les tests.
    testMatch: ['<rootDir>/tests/**/*.test.js'],

    // Mesure de la couverture : quelles parties du code sont reellement testees.
    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js'
    ],

    // Laisse le temps a la base en memoire de demarrer au premier lancement.
    testTimeout: 30000,

    // Affiche le detail de chaque test plutot qu'un simple point.
    verbose: true,

    // Evite que Jest reste bloque si une connexion tarde a se fermer.
    forceExit: true
};