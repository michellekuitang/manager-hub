import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Clock, X, Trash2, FileText, Sparkles, Copy, Check } from 'lucide-react';

const TYPES = ['post_image', 'reel', 'carrousel', 'story', 'video'];
const PILIERS = ['acquisition', 'engagement', 'fidelisation', 'notoriete'];
const PLATEFORMES = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook'];

// Libellés affichés à l'écran (les valeurs brutes ci-dessus restent les valeurs stockées en base)
const TYPE_LABELS = {
    post_image: 'Post image',
    reel: 'Reel',
    carrousel: 'Carrousel',
    story: 'Story',
    video: 'Vidéo'
};

const PILIER_LABELS = {
    acquisition: 'Acquisition',
    engagement: 'Engagement',
    fidelisation: 'Fidélisation',
    notoriete: 'Notoriété'
};

const badgeColor = (type) => {
    const colors = {
        post_image: 'bg-slate-50 text-slate-600 border-slate-200',
        reel: 'bg-pink-50 text-pink-700 border-pink-200',
        carrousel: 'bg-blue-50 text-blue-700 border-blue-200',
        story: 'bg-amber-50 text-amber-700 border-amber-200',
        video: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[type] || 'bg-slate-50 text-slate-600 border-slate-200';
};

const badgePilier = (pilier) => {
    const colors = {
        acquisition: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        engagement: 'bg-orange-50 text-orange-700 border-orange-200',
        fidelisation: 'bg-blue-50 text-blue-700 border-blue-200',
        notoriete: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[pilier] || 'bg-slate-50 text-slate-600 border-slate-200';
};

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        type: 'post_image',
        pilier: 'acquisition',
        plateforme: 'Instagram',
        temps_estime: 30,
        brief: '',
        legende: '',
        hashtags: ''
    });

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des templates :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const templatesFiltres = templates.filter((t) =>
        t.nom.toLowerCase().includes(recherche.toLowerCase())
    );

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            nom: '',
            type: 'post_image',
            pilier: 'acquisition',
            plateforme: 'Instagram',
            temps_estime: 30,
            brief: '',
            legende: '',
            hashtags: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (template) => {
        setIsEditing(true);
        setCurrentId(template._id);
        setFormData({
            nom: template.nom || '',
            type: template.type || 'post_image',
            pilier: template.pilier || 'acquisition',
            plateforme: template.plateforme || 'Instagram',
            temps_estime: template.temps_estime || 30,
            brief: template.brief || '',
            legende: template.legende || '',
            hashtags: template.hashtags || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
            try {
                await api.delete(`/templates/${currentId}`);
                setIsModalOpen(false);
                fetchTemplates();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert("Impossible de supprimer ce template.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/templates/${currentId}`, formData);
            } else {
                await api.post('/templates', formData);
            }
            setIsModalOpen(false);
            fetchTemplates();
        } catch (err) {
            console.error("Erreur lors de l'enregistrement :", err);
            alert("Une erreur est survenue lors de l'enregistrement.");
        }
    };

    // Ouvre un aperçu du template au format post, sans changer de page
    const handleUtiliser = (template, e) => {
        e.stopPropagation();
        setPreviewTemplate(template);
    };

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const parseHashtags = (texte) => (texte || '').split(/\s+/).filter(Boolean);

    const copierLePost = () => {
        if (!previewTemplate) return;
        const morceaux = [previewTemplate.legende, previewTemplate.hashtags].filter(Boolean);
        handleCopy(morceaux.join('\n\n'), 'post-complet');
    };

    if (loading) return <div className="p-6 text-slate-500 font-medium">Chargement des templates...</div>;

    return (
        <div className="p-6 md:p-8 bg-[#f8fafc] flex-1 w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Templates de contenu</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Modèles réutilisables pour industrialiser la production</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Nouveau template</span>
                </button>
            </div>

            <div className="relative max-w-sm mb-8">
                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher un template..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] transition-colors"
                />
            </div>

            {templatesFiltres.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-500 font-medium">Aucun template pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templatesFiltres.map((t) => (
                        <div
                            key={t._id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-[#3e52b7]/40 transition-all flex flex-col"
                        >
                            <div
                                onClick={() => handleOpenEditModal(t)}
                                className="cursor-pointer flex-1"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <FileText size={16} className="text-[#3e52b7]" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{t.nom}</h3>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgeColor(t.type)}`}>
                                        {TYPE_LABELS[t.type] || t.type}
                                    </span>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgePilier(t.pilier)}`}>
                                        {PILIER_LABELS[t.pilier] || t.pilier}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                                        {t.plateforme}
                                    </span>
                                </div>

                                {t.temps_estime && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                                        <Clock size={12} />
                                        <span>{t.temps_estime} min</span>
                                    </div>
                                )}

                                {t.brief && (
                                    <p className="text-xs text-slate-500 line-clamp-2">{t.brief}</p>
                                )}
                            </div>

                            <button
                                onClick={(e) => handleUtiliser(t, e)}
                                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#3e52b7] bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                            >
                                <Sparkles size={13} />
                                Utiliser ce template
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">

                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isEditing ? 'Modifier le template' : 'Nouveau template'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nom</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: ÉCOLE | TITRE | INTERVENANTS"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                    >
                                        {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pilier</label>
                                    <select
                                        value={formData.pilier}
                                        onChange={(e) => setFormData({ ...formData, pilier: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                    >
                                        {PILIERS.map(p => <option key={p} value={p}>{PILIER_LABELS[p]}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Plateforme</label>
                                    <select
                                        value={formData.plateforme}
                                        onChange={(e) => setFormData({ ...formData, plateforme: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                    >
                                        {PLATEFORMES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Temps estimé (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.temps_estime}
                                        onChange={(e) => setFormData({ ...formData, temps_estime: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Brief template</label>
                                <textarea
                                    placeholder="Objectif : [OBJECTIF]. Message clé : [MESSAGE]..."
                                    value={formData.brief}
                                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors h-24 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Légende template</label>
                                <textarea
                                    value={formData.legende}
                                    onChange={(e) => setFormData({ ...formData, legende: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors h-20 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Hashtags template</label>
                                <input
                                    type="text"
                                    placeholder="#formation #ecole..."
                                    value={formData.hashtags}
                                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-100 mt-6">
                                {isEditing ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={15} />
                                        Supprimer
                                    </button>
                                ) : (
                                    <span />
                                )}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-sm font-semibold text-white bg-[#3e52b7] hover:bg-[#34449a] rounded-lg shadow-sm transition-colors"
                                    >
                                        {isEditing ? 'Mettre à jour' : 'Sauvegarder'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Aperçu du template au format post, sans changer de page */}
            {previewTemplate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">

                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Aperçu du template</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{previewTemplate.nom}</p>
                            </div>
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 px-6 pt-5">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgeColor(previewTemplate.type)}`}>
                                {TYPE_LABELS[previewTemplate.type] || previewTemplate.type}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgePilier(previewTemplate.pilier)}`}>
                                {PILIER_LABELS[previewTemplate.pilier] || previewTemplate.pilier}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                                {previewTemplate.plateforme}
                            </span>
                        </div>

                        {/* Livrable : ce que ce template donne comme post */}
                        <div className="p-6 bg-gradient-to-br from-indigo-50/60 to-white">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                                    Contenu du post
                                </span>
                                <button
                                    onClick={copierLePost}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                    {copiedKey === 'post-complet' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    Copier le post
                                </button>
                            </div>

                            {previewTemplate.legende ? (
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                                    {previewTemplate.legende}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 italic mb-4">Aucune légende définie pour ce template.</p>
                            )}

                            {previewTemplate.hashtags && (
                                <div className="flex flex-wrap gap-1.5">
                                    {parseHashtags(previewTemplate.hashtags).map((tag, idx) => {
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

                        {/* Backstage : le brief de ce template */}
                        {previewTemplate.brief && (
                            <div className="p-6 bg-slate-50/60 border-t border-slate-100 space-y-1.5">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xs font-semibold text-slate-600">Brief de production</h4>
                                    <button
                                        onClick={() => handleCopy(previewTemplate.brief, 'brief')}
                                        className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-white transition-colors"
                                    >
                                        {copiedKey === 'brief' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{previewTemplate.brief}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;
