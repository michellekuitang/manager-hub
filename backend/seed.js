require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Utilisateur = require('./models/Utilisateur');

const seedUser = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/manager-hub';
        await mongoose.connect(mongoUri);
        console.log('Connecté à MongoDB pour réinitialiser le compte...');

        const email = 'michelle@test.com';
        const password = 'password123';

        // Supprime l'ancien compte s'il existe
        await Utilisateur.deleteOne({ email });

        // Hash exact comme dans register()
        const mot_de_passe_hash = await bcrypt.hash(password, 10);

        // Création avec les champs exacts attendus par login()
        await Utilisateur.create({
            nom: 'Kuitang',
            prenom: 'Michelle',
            email: email,
            mot_de_passe_hash: mot_de_passe_hash,
            role: 'admin'
        });

        console.log('✅ Compte utilisateur créé avec succès !');
        console.log(`Email : ${email}`);
        console.log(`Mot de passe : ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du seed :', error);
        process.exit(1);
    }
};

seedUser();