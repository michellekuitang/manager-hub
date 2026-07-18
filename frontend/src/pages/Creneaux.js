import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Corrigé avec ton chemin services/api !

const Creneaux = () => {
    const [creneaux, setCreneaux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCreneaux = async () => {
        try {
            setLoading(true);
            const response = await api.get('/creneaux');
            setCreneaux(response.data);
            setError('');
        } catch (err) {
            console.error("Erreur lors de la récupération des créneaux :", err);
            setError("Impossible de charger les créneaux.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCreneaux();
    }, []);

    const handleDeleteCreneau = async (id) => {
        if (window.confirm("Es-tu sûre de vouloir supprimer ce créneau ? S'il est associé à un tournage, le lien sera rompu.")) {
            try {
                await api.delete(`/creneaux/${id}`);
                setCreneaux(prev => prev.filter(c => c._id !== id));
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert(err.response?.data?.message || "Erreur lors de la suppression du créneau.");
            }
        }
    };

    // Formatage de date ultra-robuste
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "-";
            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return "-";
        }
    };

    // Détection robuste du statut (gère 'Reserve', 'reserve', 'Réservé', etc.)
    const getStatutBadge = (statut) => {
        if (!statut) return { text: 'Disponible', badgeClass: 'bg-green-50 text-green-700 border border-green-100', dotClass: 'bg-green-500' };
        
        const normalized = statut.toLowerCase().trim();
        const isReserved = normalized.includes('reserve') || normalized.includes('réservé');

        if (isReserved) {
            return {
                text: 'Réservé',
                badgeClass: 'bg-red-50 text-red-700 border border-red-100',
                dotClass: 'bg-red-500'
            };
        }

        return {
            text: 'Disponible',
            badgeClass: 'bg-green-50 text-green-700 border border-green-100',
            dotClass: 'bg-green-500'
        };
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 font-medium mt-4">Chargement des créneaux...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-sans">Gestion des Créneaux</h1>
                    <p className="text-gray-500 text-sm mt-1">Visualisez, contrôlez et nettoyez vos créneaux horaires en toute simplicité.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                    <span className="font-semibold mr-2">Erreur :</span> {error}
                </div>
            )}

            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-left text-xs uppercase font-semibold tracking-wider">
                            <th className="px-6 py-4 border-b border-gray-200">Date</th>
                            <th className="px-6 py-4 border-b border-gray-200">Heure Début</th>
                            <th className="px-6 py-4 border-b border-gray-200">Heure Fin</th>
                            <th className="px-6 py-4 border-b border-gray-200">Statut</th>
                            <th className="px-6 py-4 border-b border-gray-200 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {creneaux.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 bg-white">
                                    <p className="text-base font-medium">Aucun créneau enregistré pour le moment.</p>
                                </td>
                            </tr>
                        ) : (
                            creneaux.map((creneau) => {
                                const badge = getStatutBadge(creneau.statut);
                                return (
                                    <tr key={creneau._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                            {/* Supporte date ou date_creneau */}
                                            {formatDate(creneau.date || creneau.date_creneau)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {/* Supporte camelCase et snake_case */}
                                            {creneau.heureDebut || creneau.heure_debut || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {/* Supporte camelCase et snake_case */}
                                            {creneau.heureFin || creneau.heure_fin || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.badgeClass}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dotClass}`}></span>
                                                {badge.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <button
                                                onClick={() => handleDeleteCreneau(creneau._id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none transition duration-150"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Creneaux;