import { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, Copy, Check } from 'lucide-react';

const GenerateurIA = () => {
    const [marques, setMarques] = useState([]);
    const [form, setForm] = useState({
        marque_id: '',
        marque_nom: '',
        pilier: 'Engagement',
        type_contenu: 'carousel',
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
                if (res.data.length > 0) {
                    setForm(prev => ({
                        ...prev,
                        marque_id: res.data[0]._id,
                        marque_nom: res.data[0].nom
                    }));
                }
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
        if (!form.marque_id) {
            setErreur('Veuillez sélectionner une marque.');
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
                            <option value="carousel">carousel</option>
                            <option value="reel">reel</option>
                            <option value="post">post</option>
                            <option value="story">story</option>
                            <option value="article">article</option>
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

            {/* Zone de résultats structurés */}
            {resultat && (
                <div className="space-y-4 max-w-6xl pb-10 animate-fadeIn">
                    
                    {/* 1. Carte Titre */}
                    {resultat.titre && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Titre</h3>
                                <button 
                                    onClick={() => handleCopy(resultat.titre, 'titre')}
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {copiedKey === 'titre' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-lg font-bold text-slate-900 tracking-tight">{resultat.titre}</p>
                        </div>
                    )}

                    {/* 2. Carte Brief de production */}
                    {resultat.brief && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brief de production</h3>
                                <button 
                                    onClick={() => handleCopy(resultat.brief, 'brief')}
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {copiedKey === 'brief' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{resultat.brief}</p>
                        </div>
                    )}

                    {/* 3. Carte Légende */}
                    {resultat.legende && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Légende</h3>
                                <button 
                                    onClick={() => handleCopy(resultat.legende, 'legende')}
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {copiedKey === 'legende' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{resultat.legende}</p>
                        </div>
                    )}

                    {/* 4. Carte Hashtags */}
                    {resultat.hashtags && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hashtags</h3>
                                <button 
                                    onClick={() => handleCopy(resultat.hashtags, 'hashtags')}
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {copiedKey === 'hashtags' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-sm text-blue-600 font-medium leading-relaxed tracking-wide">{resultat.hashtags}</p>
                        </div>
                    )}

                    {/* 5. Carte Variantes (Bouton Copier ajouté !) */}
                    {resultat.variantes && Array.isArray(resultat.variantes) && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Variantes</h3>
                                <button 
                                    onClick={() => handleCopy(resultat.variantes.map((v, idx) => `${idx + 1}. ${v}`).join('\n'), 'variantes')}
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                    title="Copier toutes les variantes"
                                >
                                    {copiedKey === 'variantes' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <ol className="list-decimal pl-5 space-y-2 text-sm font-medium text-slate-800">
                                {resultat.variantes.map((v, idx) => (
                                    <li key={idx} className="text-slate-700 pl-1">{v}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default GenerateurIA;