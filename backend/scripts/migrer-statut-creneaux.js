// Attribue un statut aux creneaux crees avant l'ajout du champ "statut" au schema
// (Mongoose n'applique pas les valeurs par defaut retroactivement aux documents existants).
//
// Regle : 'Reserve' si le creneau a un tournage_id, 'Disponible' sinon.
//
// Usage :
//   node scripts/migrer-statut-creneaux.js              -> simulation (aucune ecriture)
//   node scripts/migrer-statut-creneaux.js --appliquer   -> ecrit reellement les changements

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Creneau = require('../models/Creneau');

const appliquer = process.argv.includes('--appliquer');

const migrer = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connecte a MongoDB. Mode : ${appliquer ? 'APPLICATION (ecriture reelle)' : 'SIMULATION (aucune ecriture)'}\n`);

    const creneauxSansStatut = await Creneau.find({ statut: { $exists: false } });

    if (creneauxSansStatut.length === 0) {
        console.log('Aucun creneau sans statut a migrer.');
        await mongoose.disconnect();
        return;
    }

    console.log(`${creneauxSansStatut.length} creneau(x) sans statut trouve(s).\n`);

    let nbReserve = 0;
    let nbDisponible = 0;

    for (const creneau of creneauxSansStatut) {
        const nouveauStatut = creneau.tournage_id ? 'Reserve' : 'Disponible';
        if (nouveauStatut === 'Reserve') nbReserve++; else nbDisponible++;

        console.log(`  ${creneau._id} -> ${nouveauStatut}${creneau.tournage_id ? ' (tournage lie)' : ''}`);

        if (appliquer) {
            await Creneau.updateOne({ _id: creneau._id }, { $set: { statut: nouveauStatut } });
        }
    }

    console.log(`\nResume : ${nbReserve} passeront a 'Reserve', ${nbDisponible} passeront a 'Disponible'.`);
    console.log(appliquer
        ? 'Migration appliquee.'
        : "Simulation terminee, aucune ecriture effectuee. Relancez avec --appliquer pour ecrire les changements.");

    await mongoose.disconnect();
};

migrer().catch((err) => {
    console.error('Erreur lors de la migration :', err);
    process.exit(1);
});
