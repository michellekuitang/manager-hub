import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, MapPin, User, GraduationCap, X, Trash2, Edit2 } from 'lucide-react';

const Marques = () => {
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);
    
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

    if (loading) return <div className="p-6 text-gray-500 font-medium">Chargement des marques...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            {/* EN-TÊTE */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]">Marques</h1>
                    <p className="text-sm text-gray-500 mt-1">{marques.length} écoles / marques</p>
                </div>
                <button 
                    onClick={handleOpenCreateModal}
                    className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Ajouter une marque</span>
                </button>
            </div>

            {/* GRILLE : Design en Rectangles minces et horizontaux */}
            {marques.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-500 font-medium">Aucune marque pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marques.map((m) => (
                        <div 
                            key={m._id} 
                            onClick={(e) => handleOpenEditModal(m, e)}
                            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex items-center justify-between relative group animate-in fade-in duration-200"
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
                                    <h3 className="font-bold text-gray-900 text-sm tracking-tight truncate" title={m.nom}>
                                        {m.nom}
                                    </h3>
                                    
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-400" />
                                            {m.campus || 'Non spécifié'}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="flex items-center gap-1 truncate">
                                            <User size={12} className="text-gray-400" />
                                            <span className="truncate">{m.cm_assigne && m.cm_assigne.trim() !== "" ? m.cm_assigne : 'Aucun CM'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Partie droite : Boutons d'action au survol */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => handleDelete(m._id, e)}
                                    className="delete-btn text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Modifier la marque' : 'Nouvelle marque'}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Nom */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Nom de l'école
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ex: ESIIA Paris"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Campus */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Campus
                                </label>
                                <select 
                                    value={formData.campus}
                                    onChange={(e) => setFormData({...formData, campus: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                >
                                    <option value="Torcy">Torcy</option>
                                    <option value="Noisiel">Noisiel</option>
                                    <option value="Lyon">Lyon</option>
                                    <option value="Évry">Évry</option>
                                </select>
                            </div>

                            {/* Géré par */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Géré par
                                </label>
                                <select 
                                    value={formData.gere_par}
                                    onChange={(e) => setFormData({...formData, gere_par: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                >
                                    <option value="Community Manager">Community Manager</option>
                                    <option value="Responsable Marketing">Responsable Marketing</option>
                                </select>
                            </div>

                            {/* CM Assigné */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    CM assigné (Optionnel)
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Nom du CM"
                                    value={formData.cm_assigne}
                                    onChange={(e) => setFormData({...formData, cm_assigne: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Couleur */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Couleur thématique
                                </label>
                                <div className="flex gap-2.5 pt-1">
                                    {couleursDisponibles.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({...formData, couleur: color})}
                                            className={`w-7 h-7 rounded-full transition-transform ${formData.couleur === color ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'opacity-80 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marques;