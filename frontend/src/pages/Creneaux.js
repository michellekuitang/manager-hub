import { useState, useEffect } from 'react';
import api from '../services/api';
import { CalendarClock, Trash2, Link } from 'lucide-react';

const CalendrierCreneaux = () => {
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
            console.error("Erreur lors de la recuperation des creneaux :", err);
            setError("Impossible de charger les creneaux.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCreneaux();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Etes-vous sur de vouloir supprimer ce creneau ? S'il est associe a un tournage, le lien sera rompu.")) {
            try {
                await api.delete(`/creneaux/${id}`);
                setCreneaux(prev => prev.filter(c => c._id !== id));
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert(err.response?.data?.message || "Erreur lors de la suppression du creneau.");
            }
        }
    };

    // Correction : on utilise date_debut et date_fin (noms exacts du modele Mongoose)
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '—';
        }
    };

    const formatHeure = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '—';
        }
    };

    const getStatutBadge = (statut) => {
        if (!statut) return { text: 'Disponible', classe: 'bg-green-50 text-green-700 border border-green-100', point: 'bg-green-500' };
        const normalized = statut.toLowerCase().trim();
        if (normalized.includes('reserve') || normalized.includes('réservé')) {
            return { text: 'Reservé', classe: 'bg-red-50 text-red-700 border border-red-100', point: 'bg-red-500' };
        }
        return { text: 'Disponible', classe: 'bg-green-50 text-green-700 border border-green-100', point: 'bg-green-500' };
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500 text-sm font-medium">Chargement des creneaux...</span>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
                        <CalendarClock size={28} className="text-blue-600" />
                        Calendrier Creneaux
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {creneaux.length} creneau{creneaux.length > 1 ? 'x' : ''} enregistre{creneaux.length > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {creneaux.length === 0 ? (
                    <div className="p-12 text-center">
                        <CalendarClock size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Aucun creneau enregistre pour le moment.</p>
                        <p className="text-gray-400 text-sm mt-1">Reservez un creneau depuis la page Tournages.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Heure debut</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Heure fin</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Objet</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Intervenant</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tournage lie</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {creneaux.map((c) => {
                                const badge = getStatutBadge(c.statut);
                                return (
                                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                                        {/* Correction : on lit date_debut pour la date */}
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatDate(c.date_debut)}
                                        </td>
                                        {/* Correction : on lit date_debut pour l'heure de debut */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatHeure(c.date_debut)}
                                        </td>
                                        {/* Correction : on lit date_fin pour l'heure de fin */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatHeure(c.date_fin)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {c.objet || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {c.intervenant_id
                                                ? `${c.intervenant_id.prenom || ''} ${c.intervenant_id.nom || ''}`.trim()
                                                : '—'
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {c.tournage_id ? (
                                                <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                                                    <Link size={13} />
                                                    {c.tournage_id.titre || 'Lié'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.classe}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.point}`}></span>
                                                {badge.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Supprimer le creneau"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CalendrierCreneaux;