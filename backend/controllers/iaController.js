const Groq = require('groq-sdk');
const GenerationIA = require('../models/GenerationIA');

const genererContenu = async (req, res) => {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const { marque_id, marque_nom, pilier, type_contenu, objectif, ton, contexte } = req.body;

        if (!marque_nom || !pilier || !type_contenu) {
            return res.status(400).json({ message: 'marque_nom, pilier et type_contenu sont requis.' });
        }

        const consigneConcept = {
            reel: "une liste de 4 à 7 plans dans l'ordre de tournage, chacun au format \"Plan X (durée approx.) : ce qui est filmé/dit\", en couvrant l'accroche, le corps et la chute",
            interview: "une liste de 4 à 7 plans dans l'ordre de tournage, chacun au format \"Plan X (durée approx.) : ce qui est filmé/dit\", en couvrant l'accroche, le corps et la chute",
            story: "une liste de 3 à 5 écrans successifs, chacun au format \"Écran X : contenu/visuel/texte affiché\"",
            carousel: "une liste de 4 à 8 slides, chacune au format \"Slide X : contenu/visuel de la slide\"",
            post: "une liste de 3 à 5 éléments concrets sur la composition visuelle (cadrage, sujet principal, texte incrusté, ambiance)",
            article: "une liste de 4 à 6 sections/paragraphes de l'article, chacune au format \"Section X : titre + idée développée\""
        };
        const instructionConcept = consigneConcept[type_contenu] || "une liste de 4 à 6 étapes concrètes de production adaptées à ce format";

        const prompt = `Tu es un expert en marketing d'influence et de production de contenu pour le secteur éducatif.
Génère une idée de contenu ultra-performante et engageante avec les critères suivants :
- Marque/École : ${marque_nom}
- Pilier éditorial : ${pilier}
- Format/Type : ${type_contenu}
- Objectif / appel à l'action souhaité : ${objectif || 'Non précisé, choisis le plus pertinent'}
- Ton de communication : ${ton || 'Non précisé, adapte-le au pilier et au format'}
- Contexte additionnel : ${contexte || 'Aucun contexte spécifique fourni'}

Tu dois renvoyer obligatoirement un objet JSON contenant exactement ces clés :
{
    "titre": "Un titre percutant adapté au format choisi",
    "brief": "L'objectif, la direction visuelle, le ton à adopter et l'idée générale du contenu en 2-3 phrases",
    "concept_production": [${instructionConcept}, sous forme de tableau de chaînes de texte, une entrée par plan/slide/écran/section],
    "legende": "La légende prête à être copiée-collée pour la publication, incluant des emojis cohérents mais sans les hashtags de fin",
    "hashtags": "Une liste uniquement composée de hashtags pertinents séparés par des espaces (ex: #Ecole #JPO)",
    "variantes": [
        "Première idée alternative ou déclinaison du sujet",
        "Deuxième idée alternative ou déclinaison du sujet",
        "Troisième idée alternative ou déclinaison du sujet"
    ]
}

Le champ "concept_production" est le plus important : il doit donner à une équipe de tournage/création tout ce qu'il faut pour produire le contenu sans se poser de questions, avec des idées concrètes et détaillées (pas de généralités).`;

        // Utilisation du mode json_object pour forcer Llama à structurer correctement
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-120b',
            temperature: 0.7,
            response_format: { type: "json_object" },
            max_tokens: 1800
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
            objectif: objectif || '',
            ton: ton || '',
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