/**
 * Jeu de données de démonstration — Manager Hub
 *
 * Remplit l'application avec un ensemble cohérent de données, centré sur la
 * semaine en cours, afin de préparer les captures d'écran du rapport et la
 * démonstration de soutenance.
 *
 * Les comptes utilisateurs existants sont préservés : seules les données
 * métier sont remplacées.
 *
 *   node scripts/seed-demo.js              simulation, n'écrit rien
 *   node scripts/seed-demo.js --appliquer  remplace les données métier
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Utilisateur  = require('../models/Utilisateur');
const Marque       = require('../models/Marque');
const Equipe       = require('../models/Equipe');
const Intervenant  = require('../models/Intervenant');
const Creneau      = require('../models/Creneau');
const Tournage     = require('../models/Tournage');
const Contenu      = require('../models/Contenu');
const Campagne     = require('../models/Campagne');
const Template     = require('../models/Template');
const GenerationIA = require('../models/GenerationIA');

const APPLIQUER = process.argv.includes('--appliquer');

// ---------------------------------------------------------------------------
// Repères de dates : tout est calculé à partir du lundi de la semaine en cours,
// afin que le rapport hebdomadaire et le bloc « tournages à venir » soient
// garnis quel que soit le jour où le script est lancé.
// ---------------------------------------------------------------------------
const LUNDI = (() => {
    const d = new Date();
    const decalage = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - decalage);
    d.setHours(0, 0, 0, 0);
    return d;
})();

const jour = (n, h = 9, m = 0) => {
    const d = new Date(LUNDI);
    d.setDate(d.getDate() + n);
    d.setHours(h, m, 0, 0);
    return d;
};

// ---------------------------------------------------------------------------
const MARQUES = [
    { nom: 'ESIIA',           campus: 'Torcy',   couleur: '#2563EB',
      description: "École supérieure d'informatique et d'intelligence artificielle" },
    { nom: 'ILMIS',           campus: 'Évry',    couleur: '#059669',
      description: 'Formations aux métiers de la santé et du social' },
    { nom: 'ESMEP',           campus: 'Torcy',   couleur: '#7C3AED',
      description: 'Formations en management et entrepreneuriat' },
    { nom: 'EMSP',            campus: 'Lyon',    couleur: '#DC2626',
      description: 'Business School — management des services' },
    { nom: 'ISMOD',           campus: 'Noisiel', couleur: '#DB2777',
      description: 'Formations aux métiers de la mode' },
    { nom: 'DCG Formations',  campus: 'Évry',    couleur: '#EA580C',
      description: 'Préparation aux diplômes de la filière comptable' },
];

const EQUIPE = [
    { nom: 'KUITANG',  prenom: 'Michelle', role: 'Community Manager',        tel: '0612345678', marque: 'ESIIA' },
    { nom: 'MERCIER',  prenom: 'Julien',   role: 'Photographe',              tel: '0623456789', marque: 'ESMEP' },
    { nom: 'BAKAYOKO', prenom: 'Aminata',  role: 'Cadreuse',                 tel: '0634567890', marque: 'ILMIS' },
    { nom: 'LEROY',    prenom: 'Thomas',   role: 'Monteur vidéo',            tel: '0645678901', marque: 'EMSP' },
    { nom: 'NGUYEN',   prenom: 'Camille',  role: 'Chargée de communication', tel: '0656789012', marque: 'ISMOD' },
];

const INTERVENANTS = [
    { nom: 'DUBOIS',   prenom: 'Sophie',   role: 'Directrice pédagogique',   marque: 'ESIIA' },
    { nom: 'JEAN',     prenom: 'Pierre',   role: 'Responsable admissions',   marque: 'ESIIA' },
    { nom: 'MARTINS',  prenom: 'Inès',     role: 'Étudiante ambassadrice',   marque: 'ILMIS' },
    { nom: 'FONTAINE', prenom: 'Marc',     role: 'Enseignant intervenant',   marque: 'ESMEP' },
    { nom: 'OKAMBA',   prenom: 'Grace',    role: 'Alumni',                   marque: 'EMSP' },
    { nom: 'ROUSSEAU', prenom: 'Léa',      role: 'Responsable de campus',    marque: 'ISMOD' },
];

const PILIERS = ['Acquisition', 'Notoriété', 'Engagement', 'Preuve sociale'];

// Tournages : décalage en jours par rapport au lundi de la semaine en cours
const TOURNAGES = [
    { titre: "Journée portes ouvertes — septembre", marque: 'ESIIA', interv: 'JEAN',
      j: -12, lieu: 'Campus de Torcy', type: 'presentation', plat: 'Instagram',
      prio: 'Haute', statut: 'Publié',
      brief: "Couvrir la journée portes ouvertes : accueil des visiteurs, visite des locaux et témoignages." },

    { titre: "Témoignage alumni — insertion professionnelle", marque: 'EMSP', interv: 'OKAMBA',
      j: -9, lieu: 'Campus de Lyon', type: 'interview', plat: 'LinkedIn',
      prio: 'Moyenne', statut: 'Publié',
      brief: "Recueillir le parcours d'une diplômée depuis sa sortie d'école jusqu'à son poste actuel." },

    { titre: "Présentation du Bachelor Développement Web", marque: 'ESIIA', interv: 'DUBOIS',
      j: -5, lieu: 'Salle informatique — Torcy', type: 'presentation', plat: 'YouTube',
      prio: 'Haute', statut: 'Validé',
      brief: "Présenter le programme, les débouchés et les modalités d'alternance du Bachelor." },

    { titre: "Vlog — une journée à l'ISMOD", marque: 'ISMOD', interv: 'ROUSSEAU',
      j: -3, lieu: 'Campus de Noisiel', type: 'vlog', plat: 'TikTok',
      prio: 'Moyenne', statut: 'Validé',
      brief: "Suivre une étudiante sur une journée type, des cours aux ateliers de création." },

    { titre: "Interview — les métiers de la santé", marque: 'ILMIS', interv: 'MARTINS',
      j: 1, lieu: "Campus d'Évry", type: 'interview', plat: 'Instagram',
      prio: 'Haute', statut: 'À valider',
      brief: "Interroger une étudiante sur son choix d'orientation et son quotidien en formation." },

    { titre: "Rentrée 2026 — accueil des nouveaux étudiants", marque: 'ESMEP', interv: 'FONTAINE',
      j: 2, lieu: 'Campus de Torcy', type: 'presentation', plat: 'Instagram',
      prio: 'Haute', statut: 'À valider',
      brief: "Filmer l'accueil de la promotion entrante et les premiers échanges avec les enseignants." },

    { titre: "Portrait — Directrice pédagogique", marque: 'ESIIA', interv: 'DUBOIS',
      j: 3, lieu: 'Bureau — Torcy', type: 'interview', plat: 'LinkedIn',
      prio: 'Moyenne', statut: 'En cours',
      brief: "Portrait vidéo présentant la vision pédagogique de l'école." },

    { titre: "Visite du campus de Lyon", marque: 'EMSP', interv: 'OKAMBA',
      j: 4, lieu: 'Campus de Lyon', type: 'vlog', plat: 'YouTube',
      prio: 'Basse', statut: 'En cours',
      brief: "Visite guidée des locaux lyonnais à destination des futurs candidats." },

    { titre: "Découverte de la filière comptable", marque: 'DCG Formations', interv: 'FONTAINE',
      j: 8, lieu: "Campus d'Évry", type: 'presentation', plat: 'LinkedIn',
      prio: 'Moyenne', statut: 'À faire',
      brief: "Présenter le DCG, ses débouchés et les passerelles vers l'expertise comptable." },

    { titre: "Atelier création — collection automne", marque: 'ISMOD', interv: 'ROUSSEAU',
      j: 10, lieu: 'Atelier — Noisiel', type: 'other', plat: 'Instagram',
      prio: 'Basse', statut: 'À faire',
      brief: "Filmer un atelier de création et le travail des étudiants sur la collection." },
];

// Contenus : rattachés à un tournage par son indice
const CONTENUS = [
    { t: 0, titre: "Reel — Ambiance JPO",              type: 'Video',        pilier: 'Notoriété',      statut: 'Publié',    j: -11 },
    { t: 0, titre: "Carrousel — Les 5 temps forts",    type: 'Carrousel',    pilier: 'Engagement',     statut: 'Publié',    j: -10 },
    { t: 1, titre: "Post — Témoignage Grace",          type: 'Video',        pilier: 'Preuve sociale', statut: 'Publié',    j: -8  },
    { t: 1, titre: "Citation — Parcours alumni",       type: 'Post statique',pilier: 'Preuve sociale', statut: 'Publié',    j: -2  },
    { t: 2, titre: "Vidéo — Présentation du Bachelor", type: 'Video',        pilier: 'Acquisition',    statut: 'Validé' },
    { t: 2, titre: "Carrousel — Programme détaillé",   type: 'Carrousel',    pilier: 'Acquisition',    statut: 'Validé' },
    { t: 3, titre: "Vlog — Une journée à l'ISMOD",     type: 'Video',        pilier: 'Engagement',     statut: 'Validé' },
    { t: 4, titre: "Reel — Les métiers de la santé",   type: 'Video',        pilier: 'Acquisition',    statut: 'À valider' },
    { t: 5, titre: "Carrousel — Rentrée 2026",         type: 'Carrousel',    pilier: 'Notoriété',      statut: 'À valider' },
    { t: 5, titre: "Post — Bienvenue à la promo",      type: 'Post statique',pilier: 'Engagement',     statut: 'À valider' },
    { t: 6, titre: "Interview — Vision pédagogique",   type: 'Video',        pilier: 'Notoriété',      statut: 'En cours' },
    { t: 7, titre: "Vlog — Campus de Lyon",            type: 'Video',        pilier: 'Acquisition',    statut: 'En cours' },
    { t: 8, titre: "Carrousel — Le DCG en 5 points",   type: 'Carrousel',    pilier: 'Acquisition',    statut: 'À faire' },
    { t: 9, titre: "Reel — Atelier collection",        type: 'Video',        pilier: 'Engagement',     statut: 'À faire' },
    { t: 9, titre: "Post — Coulisses de l'atelier",    type: 'Post statique',pilier: 'Preuve sociale', statut: 'À faire' },
];

const CAMPAGNES = [
    { nom: "Rentrée 2026 — Recrutement Bachelor", marque: 'ESIIA', type: 'Google Ads',
      statut: 'Active', campus: 'Torcy', budget: 4500, depense: 2870, leads: 214, clics: 8420,
      jd: -20, jf: 15, notes: "Campagne principale de la rentrée, axée sur les formations du numérique." },

    { nom: "Notoriété — Campus de Lyon",          marque: 'EMSP',  type: 'Meta Ads',
      statut: 'Active', campus: 'Lyon', budget: 2000, depense: 1240, leads: 96, clics: 5310,
      jd: -13, jf: 8, notes: "Faire connaître le campus lyonnais auprès des bacheliers de la région." },

    { nom: "Journées portes ouvertes — septembre", marque: 'ESMEP', type: 'Meta Ads',
      statut: 'Active', campus: 'Torcy', budget: 1500, depense: 980, leads: 73, clics: 3940,
      jd: -6, jf: 6, notes: "Promotion des JPO auprès des lycéens d'Île-de-France." },

    { nom: "Métiers de la santé — Acquisition",   marque: 'ILMIS', type: 'Google Ads',
      statut: 'Terminée', campus: 'Évry', budget: 3000, depense: 3000, leads: 187, clics: 9650,
      jd: -60, jf: -14, notes: "Campagne clôturée : objectif de leads dépassé." },

    { nom: "Collection automne — Notoriété",      marque: 'ISMOD', type: 'TikTok Ads',
      statut: 'À venir', campus: 'Noisiel', budget: 1200, depense: 0, leads: 0, clics: 0,
      jd: 12, jf: 40, notes: "Lancement prévu à l'ouverture des inscriptions." },

    { nom: "Filière comptable — Test créatifs",   marque: 'DCG Formations', type: 'LinkedIn Ads',
      statut: 'Brouillon', campus: 'Évry', budget: 800, depense: 0, leads: 0, clics: 0,
      notes: "En attente de validation des visuels." },
];

const TEMPLATES = [
    { nom: "Reel — Témoignage étudiant", type: 'Video', pilier: 'Preuve sociale', plateforme: 'Instagram',
      temps: 90, brief: "Format court de 30 à 45 secondes : accroche, parcours, conseil final.",
      legende: "Ils ont osé, ils racontent. 🎓", hashtags: "#Etudiant #Temoignage #Orientation" },
    { nom: "Carrousel — Présentation de formation", type: 'Carrousel', pilier: 'Acquisition', plateforme: 'Instagram',
      temps: 120, brief: "Six slides : titre, débouchés, programme, rythme, admission, appel à l'action.",
      legende: "Tout savoir sur cette formation en 6 slides ➡️", hashtags: "#Formation #Bachelor #Alternance" },
    { nom: "Post — Actualité du campus", type: 'Post statique', pilier: 'Notoriété', plateforme: 'LinkedIn',
      temps: 45, brief: "Visuel unique accompagné d'un texte court annonçant un événement.",
      legende: "Retour sur un moment fort de la vie du campus.", hashtags: "#Campus #VieEtudiante" },
    { nom: "Vlog — Journée type", type: 'Video', pilier: 'Engagement', plateforme: 'TikTok',
      temps: 180, brief: "Suivre un étudiant du matin au soir, en plans courts et rythmés.",
      legende: "Une journée dans nos locaux, sans filtre. 🎬", hashtags: "#JourneeType #Vlog #Etudes" },
    { nom: "Interview — Enseignant", type: 'Video', pilier: 'Notoriété', plateforme: 'YouTube',
      temps: 150, brief: "Format assis, trois questions préparées, plans de coupe sur les cours.",
      legende: "Rencontre avec celles et ceux qui vous forment.", hashtags: "#Pedagogie #Enseignement" },
];

const GENERATIONS = [
    { marque: 'ESIIA', pilier: 'Acquisition',    type: 'carousel',  objectif: "Générer des candidatures", ton: 'Dynamique' },
    { marque: 'ESIIA', pilier: 'Notoriété',      type: 'reel',      objectif: "Faire connaître l'école",  ton: 'Inspirant' },
    { marque: 'ILMIS', pilier: 'Acquisition',    type: 'post',      objectif: "Promouvoir une formation", ton: 'Rassurant' },
    { marque: 'ESMEP', pilier: 'Engagement',     type: 'story',     objectif: "Animer la communauté",     ton: 'Convivial' },
    { marque: 'EMSP',  pilier: 'Preuve sociale', type: 'interview', objectif: "Valoriser les alumni",     ton: 'Professionnel' },
    { marque: 'ISMOD', pilier: 'Engagement',     type: 'reel',      objectif: "Montrer les coulisses",    ton: 'Créatif' },
    { marque: 'ESIIA', pilier: 'Acquisition',    type: 'article',   objectif: "Expliquer l'alternance",   ton: 'Pédagogique' },
    { marque: 'DCG Formations', pilier: 'Acquisition', type: 'carousel', objectif: "Présenter le DCG",    ton: 'Sérieux' },
    { marque: 'ISMOD', pilier: 'Notoriété',      type: 'post',      objectif: "Annoncer un événement",    ton: 'Enthousiaste' },
    { marque: 'EMSP',  pilier: 'Acquisition',    type: 'reel',      objectif: "Attirer les candidats",    ton: 'Dynamique' },
];

// ---------------------------------------------------------------------------
const resultatIA = (g) => JSON.stringify({
    titre: `${g.objectif} — ${g.marque}`,
    brief: `Contenu au format ${g.type} pour la marque ${g.marque}, sur le pilier ${g.pilier}, ton ${g.ton.toLowerCase()}.`,
    concept_production: [
        "Plan 1 (3 s) : accroche visuelle sur le campus",
        "Plan 2 (8 s) : présentation du sujet face caméra",
        "Plan 3 (10 s) : illustration par des plans de coupe",
        "Plan 4 (5 s) : appel à l'action et logo de la marque"
    ],
    legende: `Découvrez ${g.marque} et ses formations. Inscriptions ouvertes.`,
    hashtags: `#${g.marque.replace(/\s/g, '')} #Formation #Orientation`,
    variantes: ["Décliner en format court", "Version témoignage étudiant", "Version enseignant"]
});

const lancer = async () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI absent du fichier .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    const base = mongoose.connection.name;

    console.log(APPLIQUER
        ? `>>> MODE ECRITURE — base « ${base} »`
        : `>>> MODE SIMULATION — base « ${base} ». Ajouter --appliquer pour écrire.`);

    const utilisateur = await Utilisateur.findOne().sort({ createdAt: 1 });
    if (!utilisateur) {
        console.error("\nAucun compte utilisateur en base. Créez d'abord un compte via la page d'inscription,");
        console.error("puis relancez ce script : les contenus doivent être rattachés à un utilisateur.");
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`Compte conservé : ${utilisateur.prenom} ${utilisateur.nom} <${utilisateur.email}>`);

    const prevu = {
        marques: MARQUES.length, equipes: EQUIPE.length, intervenants: INTERVENANTS.length,
        creneaus: TOURNAGES.length + 4, tournages: TOURNAGES.length, contenus: CONTENUS.length,
        campagnes: CAMPAGNES.length, templates: TEMPLATES.length, generationias: GENERATIONS.length,
    };

    console.log('\nDonnées qui seront créées :');
    Object.entries(prevu).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
    console.log(`\nSemaine de référence : ${jour(0).toLocaleDateString('fr-FR')} au ${jour(6).toLocaleDateString('fr-FR')}`);

    if (!APPLIQUER) {
        console.log('\nAucune écriture effectuée. Relancer avec --appliquer.');
        await mongoose.disconnect();
        return;
    }

    // --- Purge des données métier -----------------------------------------
    for (const M of [GenerationIA, Contenu, Tournage, Creneau, Campagne, Template, Intervenant, Equipe, Marque]) {
        await M.deleteMany({});
    }
    console.log('\nDonnées métier précédentes supprimées.');

    // --- Marques -----------------------------------------------------------
    const marques = {};
    for (const m of MARQUES) {
        const doc = await Marque.create({
            nom: m.nom, description: m.description, campus: m.campus, couleur: m.couleur,
            actif: true, gere_par: 'Community Manager',
            cm_assigne: `${EQUIPE[0].prenom} ${EQUIPE[0].nom}`
        });
        marques[m.nom] = doc._id;
    }

    // --- Équipe ------------------------------------------------------------
    for (const e of EQUIPE) {
        await Equipe.create({
            nom: e.nom, prenom: e.prenom,
            email: `${e.prenom}.${e.nom}`.toLowerCase().replace(/\s/g, '') + '@mbnglobal.fr',
            telephone: e.tel, role: e.role, marque: marques[e.marque], actif: true
        });
    }

    // --- Intervenants ------------------------------------------------------
    const intervenants = {};
    for (const i of INTERVENANTS) {
        const doc = await Intervenant.create({
            nom: i.nom, prenom: i.prenom,
            email: `${i.prenom}.${i.nom}`.toLowerCase() + '@mbnglobal.fr',
            telephone: '01 60 05 58 30', role: i.role, marque_id: marques[i.marque], actif: true
        });
        intervenants[i.nom] = doc._id;
    }

    // --- Tournages et créneaux associés ------------------------------------
    const tournages = [];
    for (const t of TOURNAGES) {
        const creneau = await Creneau.create({
            date_debut: jour(t.j, 9), date_fin: jour(t.j, 11),
            objet: `Tournage — ${t.titre}`, statut: 'Reserve',
            intervenant_id: intervenants[t.interv]
        });

        const tournage = await Tournage.create({
            titre: t.titre, marque_id: marques[t.marque], intervenant_id: intervenants[t.interv],
            creneau_id: creneau._id, statut: t.statut, date_tournage: jour(t.j, 9), lieu: t.lieu,
            type_contenu: t.type, plateforme: t.plat, priorite: t.prio,
            date_publication_prevue: jour(t.j + 5, 12), brief: t.brief,
            notes_internes: 'Matériel réservé auprès du service logistique.'
        });

        creneau.tournage_id = tournage._id;
        await creneau.save();
        tournages.push(tournage);
    }

    // --- Créneaux libres ---------------------------------------------------
    for (const [n, h, nom] of [[1, 14, 'DUBOIS'], [3, 14, 'JEAN'], [5, 10, 'MARTINS'], [9, 14, 'FONTAINE']]) {
        await Creneau.create({
            date_debut: jour(n, h), date_fin: jour(n, h + 2),
            objet: 'Créneau disponible', statut: 'Disponible', intervenant_id: intervenants[nom]
        });
    }

    // --- Contenus ----------------------------------------------------------
    for (const c of CONTENUS) {
        await Contenu.create({
            tournage_id: tournages[c.t]._id,
            responsable_id: utilisateur._id, auteur: utilisateur._id,
            titre: c.titre, type_contenu: c.type, statut_workflow: c.statut, pilier: c.pilier,
            description: `Contenu ${c.type.toLowerCase()} produit à partir du tournage « ${TOURNAGES[c.t].titre} ».`,
            date_creation: jour(TOURNAGES[c.t].j),
            date_publication: c.statut === 'Publié' ? jour(c.j, 12) : undefined
        });
    }

    // --- Campagnes ---------------------------------------------------------
    for (const c of CAMPAGNES) {
        await Campagne.create({
            nom: c.nom, marque_id: marques[c.marque], type: c.type, statut: c.statut, campus: c.campus,
            budget: c.budget, depense: c.depense, leads: c.leads, clics: c.clics,
            date_debut: c.jd !== undefined ? jour(c.jd) : undefined,
            date_fin:   c.jf !== undefined ? jour(c.jf) : undefined,
            notes: c.notes
        });
    }

    // --- Modèles de contenu ------------------------------------------------
    for (const t of TEMPLATES) {
        await Template.create({
            nom: t.nom, type: t.type, pilier: t.pilier, plateforme: t.plateforme,
            temps_estime: t.temps, brief: t.brief, legende: t.legende, hashtags: t.hashtags
        });
    }

    // --- Historique des générations ----------------------------------------
    for (let i = 0; i < GENERATIONS.length; i++) {
        const g = GENERATIONS[i];
        await GenerationIA.create({
            utilisateur_id: utilisateur._id, marque_id: marques[g.marque],
            pilier: g.pilier, type_contenu: g.type, objectif: g.objectif, ton: g.ton,
            contexte: "Rentrée académique 2026-2027",
            resultat: resultatIA(g),
            date_generation: jour(-i - 1, 10 + (i % 6))
        });
    }

    // --- Bilan -------------------------------------------------------------
    console.log('\nDonnées créées :');
    for (const [nom, M] of Object.entries({
        marques: Marque, equipes: Equipe, intervenants: Intervenant, creneaus: Creneau,
        tournages: Tournage, contenus: Contenu, campagnes: Campagne,
        templates: Template, generationias: GenerationIA
    })) {
        console.log(`  ${String(await M.countDocuments()).padStart(3)}  ${nom}`);
    }

    const parStatut = await Contenu.aggregate([{ $group: { _id: '$statut_workflow', n: { $sum: 1 } } }]);
    console.log('\nRépartition des contenus :',
        parStatut.map((s) => `${s._id} ${s.n}`).join('  •  '));

    const parPilier = await Contenu.aggregate([{ $group: { _id: '$pilier', n: { $sum: 1 } } }]);
    console.log('Répartition par pilier   :',
        parPilier.map((s) => `${s._id} ${s.n}`).join('  •  '));

    await mongoose.disconnect();
    console.log('\nTerminé.');
};

lancer().catch(async (e) => {
    console.error('\nÉchec :', e.message);
    await mongoose.disconnect();
    process.exit(1);
});