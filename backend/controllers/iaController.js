const Groq = require('groq-sdk');
const GenerationIA = require('../models/GenerationIA');

const genererContenu = async (req, res) => {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const { marque_id, marque_nom, pilier, type_contenu, contexte } = req.body;

        if (!marque_nom || !pilier || !type_contenu) {
            return res.status(400).json({ message: 'marque_nom, pilier et type_contenu sont requis.' });
        }

        const prompt = `Tu es un expert en marketing d'influence et de contenu pour le secteur éducatif.
Génère une idée de contenu ultra-performante et engageante avec les critères suivants :
- Marque/École : ${marque_nom}
- Pilier éditorial : ${pilier}
- Format/Type : ${type_contenu}
- Contexte additionnel : ${contexte || 'Aucun contexte spécifique fourni'}

Tu dois renvoyer obligatoirement un objet JSON contenant exactement ces clés :
{
    "titre": "Un titre percutant adapté au format choisi",
    "brief": "L'objectif, la direction visuelle, le ton à adopter et la structure globale du contenu (ex: nombre de slides, plans)",
    "legende": "La légende prête à être copiée-collée pour la publication, incluant des emojis cohérents mais sans les hashtags de fin",
    "hashtags": "Une liste uniquement composée de hashtags pertinents séparés par des espaces (ex: #Ecole #JPO)",
    "variantes": [
        "Première idée alternative ou déclinaison du sujet",
        "Deuxième idée alternative ou déclinaison du sujet",
        "Troisième idée alternative ou déclinaison du sujet"
    ]
}`;

        // Utilisation du mode json_object pour forcer Llama à structurer correctement
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            response_format: { type: "json_object" },
            max_tokens: 1200
        });

        const reponseRaw = completion.choices[0].message.content;
        let resultatParsed;

        try {
            resultatParsed = JSON.parse(reponseRaw);
        } catch (e) {
            throw new Error("L'IA n'a pas renvoyé un format JSON valide.");
        }

        // Sauvegarde dans la base de données
        const generation = new GenerationIA({
            utilisateur_id: req.user.userId,
            marque_id,
            pilier,
            type_contenu,
            contexte: contexte || '',
            resultat: JSON.stringify(resultatParsed)
        });

        await generation.save();

        // Retourner l'objet complet au frontend
        res.status(200).json({
            generation_id: generation._id,
            ...resultatParsed
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la génération.', error: error.message });
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