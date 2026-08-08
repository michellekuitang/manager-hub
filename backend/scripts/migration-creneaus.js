/**
 * Uniformisation du champ statut des creneaux.
 *
 * La base contient la valeur "Réservé" (accentuee), alors que l'enum du schema
 * Creneau n'autorise que "Disponible" et "Reserve". Ces documents sont donc
 * invalides au regard du modele : toute operation declenchant une validation
 * Mongoose les rejetterait.
 *
 * Attention au nom de la collection : Mongoose derive le nom d'une collection
 * du nom du modele en ajoutant simplement un "s". "Creneau" devient donc
 * "creneaus", et non "creneaux" comme le voudrait le pluriel francais.
 *
 * Regle appliquee :
 *   - "Reserve"    si le creneau est rattache a un tournage
 *   - "Disponible" sinon
 *
 * A lancer depuis le dossier backend :
 *   node scripts/migration-creneaus.js              (simulation, n'ecrit rien)
 *   node scripts/migration-creneaus.js --appliquer  (ecrit en base)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const APPLIQUER = process.argv.includes('--appliquer');
const NOM_COLLECTION = 'creneaus';

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
        // Garde-fou : on verifie que la collection existe avant de travailler.
        const collections = await db.listCollections().toArray();
        const noms = collections.map((c) => c.name);

        if (!noms.includes(NOM_COLLECTION)) {
            console.error(`\nCollection "${NOM_COLLECTION}" introuvable.`);
            console.error('Collections presentes :', noms.join(', '));
            process.exitCode = 1;
            return;
        }

        const collection = db.collection(NOM_COLLECTION);
        const documents = await collection.find({}).toArray();
        const operations = [];

        console.log(`\n--- Creneaux (${documents.length} document(s)) ---`);

        for (const doc of documents) {
            const cible = doc.tournage_id ? 'Reserve' : 'Disponible';
            const libelle = doc.objet || doc._id.toString();

            if (doc.statut === cible) {
                console.log(`  = ${libelle} : "${cible}" — deja conforme`);
                continue;
            }

            const actuel = doc.statut === undefined ? '(champ absent)' : `"${doc.statut}"`;
            console.log(`  ~ ${libelle} : ${actuel} -> "${cible}"`);

            operations.push({
                updateOne: { filter: { _id: doc._id }, update: { $set: { statut: cible } } }
            });
        }

        if (APPLIQUER && operations.length > 0) {
            const resultat = await collection.bulkWrite(operations);
            console.log(`  => ${resultat.modifiedCount} creneau(x) mis a jour.`);
        }

        console.log(`\nBilan : ${operations.length} creneau(x) a corriger.`);
        if (!APPLIQUER && operations.length > 0) {
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