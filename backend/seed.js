const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Chargement du modèle User (ou définition par défaut)
let User;
try {
  User = require('./models/User');
} catch (e) {
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nom: { type: String, default: 'Michelle' },
    role: { type: String, default: 'admin' }
  });
  User = mongoose.model('User', userSchema);
}

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://mongo:27017/manager-hub';

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connecté à MongoDB...');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const user = await User.findOneAndUpdate(
      { email: 'michelle@test.com' },
      { 
        email: 'michelle@test.com', 
        password: hashedPassword,
        nom: 'Michelle'
      },
      { upsert: true, new: true }
    );

    console.log('Compte prêt !');
    console.log('Email    : michelle@test.com');
    console.log('Password : 123456');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seed :', error);
    process.exit(1);
  }
}

seed();