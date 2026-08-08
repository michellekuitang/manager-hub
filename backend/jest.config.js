/**
 * Configuration Jest — a placer a la racine du dossier backend/
 */
module.exports = {
    // Environnement Node (et non navigateur) : on teste du code serveur.
    testEnvironment: 'node',

    // Fichier execute avant chaque suite de tests : il ouvre la connexion
    // a la base de test et nettoie les collections entre chaque test.
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Ou chercher les tests.
    testMatch: ['<rootDir>/tests/**/*.test.js'],

    // ------------------------------------------------------------------
    // Execution sequentielle : une suite de tests a la fois.
    //
    // Par defaut, Jest lance autant de processus qu'il y a de coeurs
    // disponibles. Tous se connectent alors simultanement au meme serveur
    // MongoDB, celui du conteneur Docker. Sous Windows, les acces reseau vers
    // un conteneur passent par une couche de virtualisation qui sature
    // rapidement : les requetes depassent leur delai d'attente et les tests
    // echouent sans que le code soit en cause.
    //
    // En sequentiel, la duree totale est un peu plus longue mais les
    // resultats sont fiables et reproductibles.
    // ------------------------------------------------------------------
    maxWorkers: 1,

    // Mesure de la couverture : quelles parties du code sont reellement testees.
    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js'
    ],

    // Marge confortable pour les operations base de donnees.
    testTimeout: 30000,

    // Affiche le detail de chaque test plutot qu'un simple point.
    verbose: true,

    // Evite que Jest reste bloque si une connexion tarde a se fermer.
    forceExit: true
};