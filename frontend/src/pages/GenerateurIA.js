import { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, Copy, Check, Clapperboard } from 'lucide-react';

const GenerateurIA = () => {
    const [marques, setMarques] = useState([]);
    const [form, setForm] = useState({
        marque_id: '',
        marque_nom: '',
        pilier: '',
        type_contenu: '',
        objectif: '',
        ton: '',
        contexte: ''
    });
    const [resultat, setResultat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    
    // Suivi de l'icône de copie active
    const [copiedKey, setCopiedKey] = useState(null);

    useEffect(() => {
        const fetchMarques = async () => {
            try {
                const res = await api.get('/marques');
                setMarques(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMarques();
    }, []);

    const handleMarqueChange = (e) => {
        const marque = marques.find(m => m._id === e.target.value);
        setForm({ ...form, marque_id: e.target.value, marque_nom: marque?.nom || '' });
    };

    const handleGenerer = async () => {
        if (!form.marque_id || !form.pilier || !form.type_contenu) {
            setErreur('Veuillez sélectionner une marque, un pilier et un type de contenu.');
            return;
        }
        setErreur('');
        setLoading(true);
        setResultat(null);
        try {
            const res = await api.post('/ia/generer', form);
            setResultat(res.data);
        } catch (err) {
            setErreur('Erreur lors de la génération du contenu.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Découpe la chaîne de hashtags en pastilles individuelles copiables
    const parseHashtags = (texte) => (texte || '').split(/\s+/).filter(Boolean);

    // Copie l'intégralité de ce que l'IA a généré (post + concept de production + notes)
    const copierLePost = () => {
        if (!resultat) return;
        const morceaux = [];

        if (resultat.titre) morceaux.push(resultat.titre);
        if (resultat.legende) morceaux.push(resultat.legende);
        if (resultat.hashtags) morceaux.push(resultat.hashtags);

        if (Array.isArray(resultat.concept_production) && resultat.concept_production.length > 0) {
            morceaux.push(
                'Concept de production :\n' +
                resultat.concept_production.map((etape, idx) => `${idx + 1}. ${etape}`).join('\n')
            );
        }

        if (resultat.brief) {
            morceaux.push(`Brief de production :\n${resultat.brief}`);
        }

        if (Array.isArray(resultat.variantes) && resultat.variantes.length > 0) {
            morceaux.push(
                'Variantes :\n' +
                resultat.variantes.map((v, idx) => `${idx + 1}. ${v}`).join('\n')
            );
        }

        handleCopy(morceaux.join('\n\n'), 'post-complet');
    };

    return (
        /* FIX SIDEBAR : On remplace min-h-screen par h-screen overflow-y-auto */
        <div className="p-6 md:p-10 bg-[#f8fafc] h-screen overflow-y-auto flex-1 w-full">
            
            {/* Titre & Sous-titre */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Générateur IA</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Génère des idées de contenu performantes pour le secteur éducatif
                </p>
            </div>

            {/* Formulaire de configuration */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Marque</label>
                        <select
                            value={form.marque_id}
                            onChange={handleMarqueChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="">Choisir une marque</option>
                            {marques.map(m => (
                                <option key={m._id} value={m._id}>{m.nom}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilier</label>
                        <select
                            value={form.pilier}
                            onChange={(e) => setForm({ ...form, pilier: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="">Choisir un pilier</option>
                            <option value="Acquisition">Acquisition</option>
                            <option value="Engagement">Engagement</option>
                            <option value="Fidelisation">Fidélisation</option>
                            <option value="Notoriete">Notoriété</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type de contenu</label>
                        <select
                            value={form.type_contenu}
                            onChange={(e) => setForm({ ...form, type_contenu: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="">Choisir un type</option>
                            <option value="carousel">carousel</option>
                            <option value="reel">reel</option>
                            <option value="post">post</option>
                            <option value="story">story</option>
                            <option value="article">article</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Objectif <span className="text-slate-400 font-normal">(optionnel)</span>
                        </label>
                        <select
                            value={form.objectif}
                            onChange={(e) => setForm({ ...form, objectif: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="">Aucun objectif précis</option>
                            <option value="S'inscrire / candidater">S'inscrire / candidater</option>
                            <option value="Suivre le compte">Suivre le compte</option>
                            <option value="Interagir en commentaire">Interagir en commentaire</option>
                            <option value="Partager la publication">Partager la publication</option>
                            <option value="Visiter le site web">Visiter le site web</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Ton <span className="text-slate-400 font-normal">(optionnel)</span>
                        </label>
                        <select
                            value={form.ton}
                            onChange={(e) => setForm({ ...form, ton: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="">Ton par défaut</option>
                            <option value="Dynamique et fun">Dynamique et fun</option>
                            <option value="Serieux et informatif">Sérieux et informatif</option>
                            <option value="Inspirant et humain">Inspirant et humain</option>
                            <option value="Decale et humoristique">Décalé et humoristique</option>
                        </select>
                    </div>
                </div>

                <div className="mb-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Contexte (optionnel)
                    </label>
                    <textarea
                        value={form.contexte}
                        onChange={(e) => setForm({ ...form, contexte: e.target.value })}
                        placeholder="Ex : Journée portes ouvertes le 15 juin, nouvelle formation data..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm h-24 resize-none transition-all"
                    />
                </div>

                {erreur && <p className="text-red-500 text-xs font-medium mb-4">{erreur}</p>}

                <button
                    onClick={handleGenerer}
                    disabled={loading}
                    className="bg-[#3b82f6] hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                    <Sparkles size={16} />
                    <span>{loading ? 'Génération...' : 'Générer'}</span>
                </button>
            </div>

            {/* Zone de résultats : une seule carte de contenu (livrable + notes de production) */}
            {resultat && (
                <div className="max-w-6xl pb-10 animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        {/* Livrable : ce qui sera réellement publié */}
                        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50/60 to-white border-b border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                                    Contenu à publier
                                </span>
                                <button
                                    onClick={copierLePost}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                    {copiedKey === 'post-complet' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    Copier le post
                                </button>
                            </div>

                            {resultat.titre && (
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                                    {resultat.titre}
                                </h2>
                            )}

                            {resultat.legende && (
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                                    {resultat.legende}
                                </p>
                            )}

                            {resultat.hashtags && (
                                <div className="flex flex-wrap gap-1.5">
                                    {parseHashtags(resultat.hashtags).map((tag, idx) => {
                                        const key = `tag-${idx}`;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => handleCopy(tag, key)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
                                            >
                                                {copiedKey === key ? <Check size={11} className="text-green-600" /> : tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Concept de production : le plan concret pour créer le contenu, adapté au format choisi */}
                        {resultat.concept_production && Array.isArray(resultat.concept_production) && resultat.concept_production.length > 0 && (
                            <div className="p-6 sm:p-8 border-b border-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clapperboard size={15} className="text-slate-500" />
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            Concept de production
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(resultat.concept_production.map((c, idx) => `${idx + 1}. ${c}`).join('\n'), 'concept')}
                                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                        title="Copier le plan de production"
                                    >
                                        {copiedKey === 'concept' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <ol className="space-y-2.5">
                                    {resultat.concept_production.map((etape, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <span>{etape}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Backstage : notes de production internes */}
                        {(resultat.brief || (resultat.variantes && resultat.variantes.length > 0)) && (
                            <div className="p-6 sm:p-8 bg-slate-50/60 space-y-5">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Notes de production
                                </span>

                                {resultat.brief && (
                                    <div>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h4 className="text-xs font-semibold text-slate-600">Brief de production</h4>
                                            <button
                                                onClick={() => handleCopy(resultat.brief, 'brief')}
                                                className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-white transition-colors"
                                            >
                                                {copiedKey === 'brief' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{resultat.brief}</p>
                                    </div>
                                )}

                                {resultat.variantes && Array.isArray(resultat.variantes) && (
                                    <div>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h4 className="text-xs font-semibold text-slate-600">Variantes</h4>
                                            <button
                                                onClick={() => handleCopy(resultat.variantes.map((v, idx) => `${idx + 1}. ${v}`).join('\n'), 'variantes')}
                                                className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-white transition-colors"
                                                title="Copier toutes les variantes"
                                            >
                                                {copiedKey === 'variantes' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
                                            {resultat.variantes.map((v, idx) => (
                                                <li key={idx} className="pl-1">{v}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerateurIA;