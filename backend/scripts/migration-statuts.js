/**
 * Uniformisation des statuts en base.
 *
 * La collection tournages contient aujourd'hui plusieurs orthographes pour le
 * meme statut ("A valider" et "À valider"), selon que la valeur a ete ecrite
 * par le formulaire Tournages ou par la synchronisation depuis les contenus.
 * Ce script ramene toutes les valeurs a la forme canonique accentuee, celle
 * declaree dans l'enum des schemas.
 *
 * A lancer depuis le dossier backend :
 *   node scripts/migration-statuts.js              (simulation, n'ecrit rien)
 *   node scripts/migration-statuts.js --appliquer  (ecrit en base)
 *
 * Le script accede aux collections via le driver natif et non via Mongoose,
 * afin de pouvoir lire les valeurs qui ne respectent pas encore l'enum.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const APPLIQUER = process.argv.includes('--appliquer');

const sansAccent = (valeur) =>
    String(valeur || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

// Forme canonique attendue par l'enum des schemas.
const canoniser = (valeur) => {
    const v = sansAccent(valeur);
    if (!v || v === 'brouillon') return 'À faire';
    if (v.includes('faire')) return 'À faire';
    if (v.includes('cours')) return 'En cours';
    if (v.includes('valider')) return 'À valider';
    if (v.includes('valide')) return 'Validé';
    if (v.includes('publi')) return 'Publié';
    return null; // valeur non reconnue : signalee sans etre modifiee
};

const migrerCollection = async (db, nomCollection, champ, libelle) => {
    const collection = db.collection(nomCollection);
    const documents = await collection.find({}).toArray();
    const operations = [];
    const nonReconnus = [];

    console.log(`\n--- ${libelle} (${documents.length} document(s)) ---`);

    for (const doc of documents) {
        const valeurActuelle = doc[champ];
        const cible = canoniser(valeurActuelle);

        if (cible === null) {
            nonReconnus.push({ titre: doc.titre, valeur: valeurActuelle });
            console.log(`  ! ${doc.titre} : valeur non reconnue "${valeurActuelle}" — laissee en l'etat`);
            continue;
        }

        if (valeurActuelle === cible) {
            console.log(`  = ${doc.titre} : "${cible}" — deja conforme`);
            continue;
        }

        console.log(`  ~ ${doc.titre} : "${valeurActuelle}" -> "${cible}"`);
        operations.push({
            updateOne: { filter: { _id: doc._id }, update: { $set: { [champ]: cible } } }
        });
    }

    if (APPLIQUER && operations.length > 0) {
        const resultat = await collection.bulkWrite(operations);
        console.log(`  => ${resultat.modifiedCount} document(s) mis a jour.`);
    }

    return { aCorriger: operations.length, nonReconnus };
};

const lancer = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI absent du fichier .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(APPLIQUER
        ? '>>> MODE ECRITURE : les modifications seront enregistrees.'
        : '>>> MODE SIMULATION : aucune ecriture. Ajouter --appliquer pour executer.');

    const db = mongoose.connection.db;

    try {
        const tournages = await migrerCollection(db, 'tournages', 'statut', 'Tournages');
        const contenus = await migrerCollection(db, 'contenus', 'statut_workflow', 'Contenus');

        const total = tournages.aCorriger + contenus.aCorriger;
        const inconnus = [...tournages.nonReconnus, ...contenus.nonReconnus];

        console.log(`\nBilan : ${total} document(s) a corriger.`);

        if (inconnus.length > 0) {
            console.log(`Attention : ${inconnus.length} valeur(s) non reconnue(s). A traiter manuellement.`);
        }

        if (!APPLIQUER && total > 0) {
            console.log('Relancer avec --appliquer pour ecrire les modifications.');
        }
    } catch (error) {
        console.error('Echec de la migration :', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

lancer();