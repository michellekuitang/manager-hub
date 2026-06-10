const Groq = require('groq-sdk');
const GenerationIA = require('../models/GenerationIA');

const genererContenu = async (req, res) => {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const { marque_id, marque_nom, pilier, type_contenu, contexte } = req.body;

        if (!marque_nom || !pilier || !type_contenu) {
            return res.status(400).json({ message: 'marque_nom, pilier et type_contenu sont requis.' });
        }

        const prompt = `Tu es un expert en marketing pour le secteur educatif.
Genere un contenu marketing pour les reseaux sociaux avec les informations suivantes :
- Marque : ${marque_nom}
- Pilier editorial : ${pilier}
- Format : ${type_contenu}
- Contexte : ${contexte || 'Aucun contexte specifique'}

Reponds uniquement en JSON avec ce format exact :
{
    "script": "Le script ou texte principal du contenu",
    "caption": "La legende pour les reseaux sociaux avec les hashtags"
}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1000
        });

        const reponse = completion.choices[0].message.content;

        let resultat;
        try {
            resultat = JSON.parse(reponse);
        } catch (e) {
            resultat = { script: reponse, caption: '' };
        }

        const generation = new GenerationIA({
            utilisateur_id: req.user.userId,
            marque_id,
            pilier,
            type_contenu,
            contexte: contexte || '',
            resultat: JSON.stringify(resultat)
        });

        await generation.save();

        res.status(200).json({
            generation_id: generation._id,
            script: resultat.script,
            caption: resultat.caption
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la generation.', error: error.message });
    }
};

const getGenerations = async (req, res) => {
    try {
        const generations = await GenerationIA.find({ utilisateur_id: req.user.userId })
            .populate('marque_id', 'nom')
            .sort({ date_generation: -1 });
        res.status(200).json(generations);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { genererContenu, getGenerations };