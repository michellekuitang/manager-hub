const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');

const register = async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe } = req.body;

        const existant = await Utilisateur.findOne({ email });
        if (existant) {
            return res.status(400).json({ message: 'Cet email est deja utilise.' });
        }

        const mot_de_passe_hash = await bcrypt.hash(mot_de_passe, 10);

        const utilisateur = new Utilisateur({
            nom,
            prenom,
            email,
            mot_de_passe_hash
        });

        await utilisateur.save();

        res.status(201).json({ message: 'Compte cree avec succes.' });

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        const utilisateur = await Utilisateur.findOne({ email });
        if (!utilisateur) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const valide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe_hash);
        if (!valide) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { userId: utilisateur._id, role: utilisateur.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            token,
            utilisateur: {
                id: utilisateur._id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                role: utilisateur.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { register, login };