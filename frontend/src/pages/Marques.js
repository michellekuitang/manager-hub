import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, MapPin, User, GraduationCap, X, Trash2, Search } from 'lucide-react';

const Marques = () => {
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);

    const [recherche, setRecherche] = useState('');
    const [filtreCampus, setFiltreCampus] = useState('Tous');

    // États pour gérer la modale (Création vs Édition)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMarqueId, setCurrentMarqueId] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        campus: 'Torcy',
        gere_par: 'Community Manager',
        cm_assigne: '',
        couleur: '#4f46e5'
    });

    const couleursDisponibles = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    const fetchMarques = async () => {
        try {
            setLoading(true);
            const res = await api.get('/marques');
            setMarques(res.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des marques :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarques();
    }, []);

    // Liste des campus disponibles, calculée a partir des marques existantes
    const campusDisponibles = ['Tous', ...new Set(marques.map(m => m.campus).filter(Boolean))];

    // Marques filtrées selon la recherche et le campus selectionne
    const marquesFiltrees = marques.filter((m) => {
        const correspondNom = m.nom.toLowerCase().includes(recherche.toLowerCase());
        const correspondCampus = filtreCampus === 'Tous' || m.campus === filtreCampus;
        return correspondNom && correspondCampus;
    });

    // Ouvrir la modale en mode création
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentMarqueId(null);
        setFormData({
            nom: '',
            campus: 'Torcy',
            gere_par: 'Community Manager',
            cm_assigne: '',
            couleur: '#4f46e5'
        });
        setIsModalOpen(true);
    };

    // Ouvrir la modale en mode édition suite au clic sur une carte
    const handleOpenEditModal = (marque, e) => {
        // Optionnel : évite de déclencher la modale si on clique spécifiquement sur la poubelle
        if (e.target.closest('.delete-btn')) return;

        setIsEditing(true);
        setCurrentMarqueId(marque._id);
        setFormData({
            nom: marque.nom || '',
            campus: marque.campus || 'Torcy',
            gere_par: marque.gere_par || 'Community Manager',
            cm_assigne: marque.cm_assigne || '',
            couleur: marque.couleur || '#4f46e5'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Empêche l'ouverture de la modale d'édition
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette marque ?")) {
            try {
                await api.delete(`/marques/${id}`);
                fetchMarques();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert("Impossible de supprimer la marque.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // Mode Édition : Requête PUT vers /marques/:id
                await api.put(`/marques/${currentMarqueId}`, formData);
            } else {
                // Mode Création : Requête POST
                await api.post('/marques', formData);
            }

            setIsModalOpen(false);
            fetchMarques();
        } catch (err) {
            console.error("Erreur lors de l'enregistrement de la marque :", err);
            alert("Une erreur est survenue lors de l'enregistrement.");
        }
    };

    if (loading) return <div className="p-6 text-slate-500 font-medium">Chargement des marques...</div>;

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen flex-1">
            {/* EN-TÊTE */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marques</h1>
                    <p className="text-sm text-slate-500 mt-1">{marquesFiltrees.length} sur {marques.length} écoles / marques</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Ajouter une marque</span>
                </button>
            </div>

            {/* BARRE DE RECHERCHE ET FILTRE */}
            <div className="flex gap-3 mb-8">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une marque..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] transition-colors"
                    />
                </div>

                <select
                    value={filtreCampus}
                    onChange={(e) => setFiltreCampus(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#3e52b7] transition-colors"
                >
                    {campusDisponibles.map((campus) => (
                        <option key={campus} value={campus}>{campus}</option>
                    ))}
                </select>
            </div>

            {/* GRILLE : Design en Rectangles minces et horizontaux */}
            {marquesFiltrees.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-500 font-medium">Aucune marque ne correspond à votre recherche.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marquesFiltrees.map((m) => (
                        <div
                            key={m._id}
                            onClick={(e) => handleOpenEditModal(m, e)}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-[#3e52b7]/40 transition-all cursor-pointer flex items-center justify-between relative group animate-in fade-in duration-200"
                        >
                            {/* Partie gauche : Icône + Infos empilées horizontalement */}
                            <div className="flex items-center gap-4 truncate mr-12">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${m.couleur || '#4f46e5'}15`, color: m.couleur || '#4f46e5' }}
                                >
                                    <GraduationCap size={20} />
                                </div>

                                <div className="truncate">
                                    <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate" title={m.nom}>
                                        {m.nom}
                                    </h3>

                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} className="text-slate-400" />
                                            {m.campus || 'Non spécifié'}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="flex items-center gap-1 truncate">
                                            <User size={12} className="text-slate-400" />
                                            <span className="truncate">{m.cm_assigne && m.cm_assigne.trim() !== "" ? m.cm_assigne : 'Aucun CM'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Partie droite : Boutons d'action au survol */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => handleDelete(m._id, e)}
                                    className="delete-btn text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Supprimer la marque"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODALE UNIQUE (Création ou Édition dynamique) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isEditing ? 'Modifier la marque' : 'Nouvelle marque'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Nom */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Nom de l'école
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: ESIIA Paris"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Campus */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Campus
                                </label>
                                <select
                                    value={formData.campus}
                                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                >
                                    <option value="Torcy">Torcy</option>
                                    <option value="Noisiel">Noisiel</option>
                                    <option value="Lyon">Lyon</option>
                                    <option value="Évry">Évry</option>
                                    <option value="International">International</option>
                                </select>
                            </div>

                            {/* Géré par */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Géré par
                                </label>
                                <select
                                    value={formData.gere_par}
                                    onChange={(e) => setFormData({ ...formData, gere_par: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                >
                                    <option value="Community Manager">Community Manager</option>
                                    <option value="Responsable Marketing">Responsable Marketing</option>
                                </select>
                            </div>

                            {/* CM Assigné */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    CM assigné (Optionnel)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nom du CM"
                                    value={formData.cm_assigne}
                                    onChange={(e) => setFormData({ ...formData, cm_assigne: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Couleur */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Couleur thématique
                                </label>
                                <div className="flex gap-2.5 pt-1">
                                    {couleursDisponibles.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, couleur: color })}
                                            className={`w-7 h-7 rounded-full transition-transform ${formData.couleur === color ? 'scale-110 ring-2 ring-offset-2 ring-[#3e52b7]' : 'opacity-80 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marques;
