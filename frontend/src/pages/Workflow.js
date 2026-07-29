import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, X, ChevronRight, Trash2 } from 'lucide-react';

// Statuts alignés sur le schéma Mongoose (Contenu.js)
const STATUTS = ['À faire', 'En cours', 'À valider', 'Validé', 'Publié'];

const STATUTS_COLORS = {
    'À faire': 'border-blue-400',
    'En cours': 'border-cyan-400',
    'À valider': 'border-yellow-400',
    'Validé': 'border-green-500',
    'Publié': 'border-purple-500'
};

const TYPES = ['Carrousel', 'Reel', 'Post statique', 'Story', 'Video', 'Article'];
const PILIERS = ['Acquisition', 'Engagement', 'Fidelisation', 'Notoriete'];

// Mapping des types issus de la page Tournages vers les types Workflow
const MAP_TYPES_TOURNAGE = {
    'interview': 'Video',
    'presentation': 'Video',
    'vlog': 'Reel',
    'reel': 'Reel',
    'carrousel': 'Carrousel',
    'post statique': 'Post statique',
    'story': 'Story',
    'video': 'Video',
    'article': 'Article',
    'other': 'Video'
};

// Normalisation de secours si un statut sans accent arrive de l'API
const normaliserStatut = (statut) => {
    if (!statut) return 'À faire';
    const map = {
        'A faire': 'À faire',
        'En cours': 'En cours',
        'A valider': 'À valider',
        'Valide': 'Validé',
        'Publie': 'Publié'
    };
    return map[statut] || statut;
};

const Workflow = () => {
    const [contenus, setContenus] = useState([]);
    const [tournages, setTournages] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtreMarque, setFiltreMarque] = useState('Toutes les marques');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [form, setForm] = useState({
        tournage_id: '',
        titre: '',
        type_contenu: 'Carrousel',
        pilier: 'Acquisition',
        description: '',
        date_publication: '',
        statut_workflow: 'À faire'
    });

    const fetchData = async () => {
        setLoading(true);

        try {
            const resTournages = await api.get('/tournages');
            const dataT = resTournages.data;
            setTournages(Array.isArray(dataT) ? dataT : (dataT?.tournages || dataT?.data || []));
        } catch (err) {
            console.error("Erreur chargement /tournages", err);
        }

        try {
            const resContenus = await api.get('/contenus');
            const dataC = resContenus.data;
            setContenus(Array.isArray(dataC) ? dataC : (dataC?.contenus || dataC?.data || []));
        } catch (err) {
            console.error("Erreur chargement /contenus", err);
        }

        try {
            const resMarques = await api.get('/marques');
            const dataM = resMarques.data;
            setMarques(Array.isArray(dataM) ? dataM : (dataM?.marques || dataM?.data || []));
        } catch (err) {
            console.error("Erreur chargement /marques", err);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        setIsEditing(false);
        setCurrentId(null);
        setForm({
            tournage_id: '',
            titre: '',
            type_contenu: 'Carrousel',
            pilier: 'Acquisition',
            description: '',
            date_publication: '',
            statut_workflow: 'À faire'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (contenu) => {
        setIsEditing(true);
        setCurrentId(contenu._id);
        setForm({
            tournage_id: contenu.tournage_id?._id || contenu.tournage_id || '',
            titre: contenu.titre || '',
            type_contenu: contenu.type_contenu || 'Carrousel',
            pilier: contenu.pilier || 'Acquisition',
            description: contenu.description || '',
            date_publication: contenu.date_publication
                ? new Date(contenu.date_publication).toISOString().split('T')[0]
                : '',
            statut_workflow: normaliserStatut(contenu.statut_workflow)
        });
        setIsModalOpen(true);
    };

    // Auto-remplissage dynamique avec conversion des types et récupération du statut du tournage
    const handleTournageChange = (e) => {
        const selectedTournageId = e.target.value;

        if (!selectedTournageId) {
            setForm(prev => ({ ...prev, tournage_id: '' }));
            return;
        }

        const tournageObj = tournages.find(t => String(t._id || t.id) === String(selectedTournageId));

        if (tournageObj) {
            // Extraction et formatage de la date de publication
            const datePublicationFormatee = tournageObj.date_publication_prevue
                ? new Date(tournageObj.date_publication_prevue).toISOString().split('T')[0]
                : '';

            const rawType = (tournageObj.type_contenu || '').toLowerCase();
            const tournageStatut = normaliserStatut(tournageObj.statut || tournageObj.statut_workflow);

            setForm(prev => {
                const typeMappe = MAP_TYPES_TOURNAGE[rawType] || (TYPES.includes(tournageObj.type_contenu) ? tournageObj.type_contenu : prev.type_contenu);

                return {
                    ...prev,
                    tournage_id: selectedTournageId,
                    titre: tournageObj.titre || prev.titre,
                    description: tournageObj.brief || tournageObj.notes_internes || prev.description,
                    date_publication: datePublicationFormatee || prev.date_publication,
                    type_contenu: typeMappe || prev.type_contenu,
                    statut_workflow: tournageStatut || prev.statut_workflow
                };
            });
        } else {
            setForm(prev => ({ ...prev, tournage_id: selectedTournageId }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.tournage_id) {
            alert("Veuillez sélectionner un tournage.");
            return;
        }
        try {
            if (isEditing) {
                await api.put(`/contenus/${currentId}`, form);
            } else {
                await api.post('/contenus', form);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Erreur enregistrement contenu :", err.response?.data);
            const detailErreur = err.response?.data?.error || err.response?.data?.message || "Erreur lors de l'enregistrement.";
            alert(`Erreur : ${detailErreur}`);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contenu ?")) {
            try {
                await api.delete(`/contenus/${currentId}`);
                setIsModalOpen(false);
                fetchData();
            } catch (err) {
                console.error("Erreur suppression", err);
                alert("Impossible de supprimer ce contenu.");
            }
        }
    };

    const handleAvancer = async (contenu, e) => {
        e.stopPropagation();
        const statutActuel = normaliserStatut(contenu.statut_workflow);
        const currentIndex = STATUTS.indexOf(statutActuel);
        if (currentIndex === -1 || currentIndex === STATUTS.length - 1) return;

        const nextStatut = STATUTS[currentIndex + 1];
        try {
            // Envoi de la double convention de nommage pour garantir la prise en compte backend
            await api.patch(`/contenus/${contenu._id}/statut`, {
                nouveau_statut: nextStatut,
                nouveauStatut: nextStatut
            });
            fetchData();
        } catch (err) {
            console.error("Erreur avancement statut", err);
            alert(err.response?.data?.message || "Impossible de changer de statut.");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const contenusFiltres = contenus.filter(c => {
        if (filtreMarque === 'Toutes les marques') return true;
        return c.tournage_id?.marque_id?.nom === filtreMarque;
    });

    const getContenusParStatut = (statut) =>
        contenusFiltres.filter(c => normaliserStatut(c.statut_workflow) === statut);

    if (loading) return <div className="p-6 text-gray-500 text-sm font-medium">Chargement du workflow...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]">Workflow</h1>
                    <p className="text-sm text-gray-500 mt-1">Kanban de production de contenu</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreate}
                        className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                    >
                        <Plus size={18} />
                        Nouveau contenu
                    </button>
                    <select
                        value={filtreMarque}
                        onChange={(e) => setFiltreMarque(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        <option>Toutes les marques</option>
                        {marques.map(m => (
                            <option key={m._id || m.id} value={m.nom}>{m.nom}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KANBAN */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUTS.map(statut => {
                    const items = getContenusParStatut(statut);
                    return (
                        <div key={statut} className="flex-shrink-0 w-72">
                            <div className={`bg-white rounded-xl border-t-4 ${STATUTS_COLORS[statut]} shadow-sm`}>
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800 text-sm">{statut}</h3>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {items.length}
                                    </span>
                                </div>
                                <div className="p-3 space-y-3 min-h-32">
                                    {items.length === 0 ? (
                                        <p className="text-center text-gray-400 text-xs py-6">Aucun contenu</p>
                                    ) : (
                                        items.map(c => (
                                            <div
                                                key={c._id || c.id}
                                                onClick={() => handleOpenEdit(c)}
                                                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                                            >
                                                <p className="font-semibold text-gray-900 text-sm mb-1">{c.titre}</p>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-gray-500">{c.type_contenu}</span>
                                                    {c.date_publication && (
                                                        <>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-xs text-gray-500">{formatDate(c.date_publication)}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {c.tournage_id?.marque_id?.nom ? (
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        {c.tournage_id.marque_id.nom}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sans marque</span>
                                                )}

                                                {statut !== 'Publié' && (
                                                    <button
                                                        onClick={(e) => handleAvancer(c, e)}
                                                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg py-1.5 transition-colors"
                                                    >
                                                        Avancer
                                                        <ChevronRight size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODALE DE CRÉATION / ÉDITION */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">

                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Modifier le contenu' : 'Nouveau contenu'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Tournage associé *
                                </label>
                                <select
                                    required
                                    value={form.tournage_id}
                                    onChange={handleTournageChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                >
                                    <option value="" disabled>Choisir un tournage</option>
                                    {tournages.length > 0 ? (
                                        tournages.map(t => (
                                            <option key={t._id || t.id} value={t._id || t.id}>
                                                {t.titre || t.nom || 'Tournage sans titre'} {t.marque_id?.nom ? `— ${t.marque_id.nom}` : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Aucun tournage disponible</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Reel JPO..."
                                    value={form.titre}
                                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Type
                                    </label>
                                    <select
                                        value={form.type_contenu}
                                        onChange={(e) => setForm({ ...form, type_contenu: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    >
                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Pilier
                                    </label>
                                    <select
                                        value={form.pilier}
                                        onChange={(e) => setForm({ ...form, pilier: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    >
                                        {PILIERS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Objectifs, axes de communication..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors h-20 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Date de publication prévue
                                </label>
                                <input
                                    type="date"
                                    value={form.date_publication}
                                    onChange={(e) => setForm({ ...form, date_publication: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
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
                                ) : <span />}
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
                                        {isEditing ? 'Mettre à jour' : 'Sauvegarder'}
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

export default Workflow;