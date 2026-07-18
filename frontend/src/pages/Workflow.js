import { useState, useEffect } from 'react';
import api from '../services/api';

// Liste des statuts attendus par la base de données (sans accents)
const STATUTS = ['A faire', 'En cours', 'A valider', 'Valide', 'Publie'];

// Configuration visuelle et linguistique pour l'affichage
const STATUTS_CONFIG = {
    'A faire': { label: 'À faire', colorClass: 'border-blue-500' },
    'En cours': { label: 'En cours', colorClass: 'border-sky-400' },
    'A valider': { label: 'À valider', colorClass: 'border-amber-500' },
    'Valide': { label: 'Validé', colorClass: 'border-emerald-500' },
    'Publie': { label: 'Publié', colorClass: 'border-purple-500' }
};

const Workflow = () => {
    const [contenus, setContenus] = useState([]);
    const [marques, setMarques] = useState([]);
    const [selectedMarque, setSelectedMarque] = useState('toutes');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Chargement des contenus et des marques en parallèle
                const [resContenus, resMarques] = await Promise.all([
                    api.get('/contenus'),
                    api.get('/marques')
                ]);
                setContenus(resContenus.data);
                setMarques(resMarques.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des données :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fonction pour faire passer un contenu à l'étape suivante
    const handleAvancer = async (id, currentStatut) => {
        const currentIndex = STATUTS.indexOf(currentStatut);
        if (currentIndex === -1 || currentIndex === STATUTS.length - 1) return; // Déjà à la fin

        const nextStatut = STATUTS[currentIndex + 1];

        try {
            // Appel de ta route backend PATCH /api/contenus/:id/statut
            await api.patch(`/contenus/${id}/statut`, { statut_workflow: nextStatut });
            
            // Mise à jour de l'état local pour refléter le changement instantanément
            setContenus(prev => prev.map(c => 
                c._id === id ? { ...c, statut_workflow: nextStatut } : c
            ));
        } catch (err) {
            console.error("Erreur lors de la mise à jour du statut :", err);
        }
    };

    // Helper pour formater proprement les dates (ex: "9 juin")
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    // Extraction sécurisée du nom de la marque associée au contenu (via tournage_id ou direct)
    const getBrandName = (c) => {
        if (c.tournage_id && typeof c.tournage_id === 'object' && c.tournage_id.marque_id) {
            return c.tournage_id.marque_id.nom || 'Sans marque';
        }
        if (c.marque_id && typeof c.marque_id === 'object') {
            return c.marque_id.nom;
        }
        return 'Sans marque';
    };

    // Extraction sécurisée de l'ID de la marque pour le filtrage
    const getBrandId = (c) => {
        if (c.tournage_id && typeof c.tournage_id === 'object' && c.tournage_id.marque_id) {
            return typeof c.tournage_id.marque_id === 'object' ? c.tournage_id.marque_id._id : c.tournage_id.marque_id;
        }
        if (c.marque_id) {
            return typeof c.marque_id === 'object' ? c.marque_id._id : c.marque_id;
        }
        return null;
    };

    // Filtrage des contenus selon la marque sélectionnée
    const filteredContenus = contenus.filter(c => {
        if (selectedMarque === 'toutes') return true;
        return getBrandId(c) === selectedMarque;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto flex flex-col h-full">
            
            {/* ==========================================
                EN-TÊTE DU WORKFLOW
               ========================================== */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workflow</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kanban de production de contenu</p>
                </div>
                
                {/* Sélecteur de marque style Base44 */}
                <div className="relative">
                    <select
                        value={selectedMarque}
                        onChange={(e) => setSelectedMarque(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 rounded-lg py-1.5 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                    >
                        <option value="toutes">Toutes les marques</option>
                        {marques.map(m => (
                            <option key={m._id} value={m._id}>{m.nom}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* ==========================================
                ZONE DE DÉFILEMENT DU KANBAN
               ========================================== */}
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="flex gap-4 min-w-[1100px]">
                    
                    {STATUTS.map(statut => {
                        const columnContenus = filteredContenus.filter(c => c.statut_workflow === statut);
                        const { label, colorClass } = STATUTS_CONFIG[statut];

                        return (
                            <div key={statut} className="flex-1 bg-gray-50/50 border border-gray-100 rounded-xl p-3 flex flex-col min-h-[500px]">
                                
                                {/* En-tête de colonne */}
                                <div className={`flex items-center justify-between bg-white px-3 py-2.5 rounded-t-xl border-t-4 ${colorClass} shadow-sm mb-4`}>
                                    <span className="text-sm font-bold text-gray-800">{label}</span>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-extrabold px-2 py-0.5 rounded-full">
                                        {columnContenus.length}
                                    </span>
                                </div>

                                {/* Liste des cartes */}
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 scrollbar-none">
                                    {columnContenus.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-gray-400 italic">
                                            Aucun contenu
                                        </div>
                                    ) : (
                                        columnContenus.map(c => (
                                            <div key={c._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                                
                                                {/* Titre */}
                                                <h4 className="text-sm font-bold text-gray-900 break-words line-clamp-2">
                                                    {c.titre}
                                                </h4>
                                                
                                                {/* Type & Date */}
                                                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                                                    <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                                                        {c.type_contenu || 'Type inconnu'}
                                                    </span>
                                                    <span>
                                                        {formatDate(c.date_publication || c.date_creation)}
                                                    </span>
                                                </div>

                                                {/* Marque */}
                                                <p className="text-xs font-semibold text-blue-600 mt-2">
                                                    {getBrandName(c)}
                                                </p>

                                                {/* Bouton d'action */}
                                                {statut !== 'Publie' && (
                                                    <button
                                                        onClick={() => handleAvancer(c._id, statut)}
                                                        className="mt-4 mx-auto flex items-center justify-center gap-1.5 py-1 px-4 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <span>Avancer</span>
                                                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>
                        );
                    })}

                </div>
            </div>

        </div>
    );
};

export default Workflow;