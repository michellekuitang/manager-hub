import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Clock, X, Trash2, FileText } from 'lucide-react';

const TYPES = ['post_image', 'reel', 'carrousel', 'story', 'video'];
const PILIERS = ['acquisition', 'engagement', 'fidelisation', 'notoriete'];
const PLATEFORMES = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook'];

const badgeColor = (type) => {
    const colors = {
        post_image: 'bg-gray-100 text-gray-700',
        reel: 'bg-pink-50 text-pink-700',
        carrousel: 'bg-blue-50 text-blue-700',
        story: 'bg-yellow-50 text-yellow-700',
        video: 'bg-purple-50 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
};

const badgePilier = (pilier) => {
    const colors = {
        acquisition: 'bg-green-50 text-green-700',
        engagement: 'bg-orange-50 text-orange-700',
        fidelisation: 'bg-blue-50 text-blue-700',
        notoriete: 'bg-purple-50 text-purple-700'
    };
    return colors[pilier] || 'bg-gray-100 text-gray-700';
};

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

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
            console.error("Erreur lors de la recuperation des templates :", err);
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
        if (window.confirm("Etes-vous sur de vouloir supprimer ce template ?")) {
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

    if (loading) return <div className="p-6 text-gray-500 font-medium">Chargement des templates...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]">Templates de contenu</h1>
                    <p className="text-sm text-gray-500 mt-1">Modeles reutilisables pour industrialiser la production</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Nouveau template</span>
                </button>
            </div>

            <div className="relative max-w-sm mb-8">
                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher un template..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {templatesFiltres.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-500 font-medium">Aucun template pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templatesFiltres.map((t) => (
                        <div
                            key={t._id}
                            onClick={() => handleOpenEditModal(t)}
                            className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <FileText size={16} className="text-blue-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{t.nom}</h3>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColor(t.type)}`}>
                                    {t.type}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgePilier(t.pilier)}`}>
                                    {t.pilier}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                    {t.plateforme}
                                </span>
                            </div>

                            {t.temps_estime && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                    <Clock size={12} />
                                    <span>{t.temps_estime} min</span>
                                </div>
                            )}

                            {t.brief && (
                                <p className="text-xs text-gray-500 line-clamp-2">{t.brief}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">

                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Modifier le template' : 'Nouveau template'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nom</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: ECOLE | TITRE | INTERVENANTS"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    >
                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pilier</label>
                                    <select
                                        value={formData.pilier}
                                        onChange={(e) => setFormData({ ...formData, pilier: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    >
                                        {PILIERS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Plateforme</label>
                                    <select
                                        value={formData.plateforme}
                                        onChange={(e) => setFormData({ ...formData, plateforme: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    >
                                        {PLATEFORMES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Temps estimé (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.temps_estime}
                                        onChange={(e) => setFormData({ ...formData, temps_estime: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Brief template</label>
                                <textarea
                                    placeholder="Objectif : [OBJECTIF]. Message cle : [MESSAGE]..."
                                    value={formData.brief}
                                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors h-24 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Legende template</label>
                                <textarea
                                    value={formData.legende}
                                    onChange={(e) => setFormData({ ...formData, legende: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors h-20 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hashtags template</label>
                                <input
                                    type="text"
                                    placeholder="#formation #ecole..."
                                    value={formData.hashtags}
                                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100 mt-6">
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
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-sm font-semibold text-white bg-[#3b82f6] hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        {isEditing ? 'Mettre a jour' : 'Sauvegarder'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;