import { useState, useEffect } from 'react';
import api from '../services/api';
import { CalendarClock, Trash2, Link, X, Save } from 'lucide-react';

const CalendrierCreneaux = () => {
    const [creneaux, setCreneaux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Etats pour la modale d'edition
    const [selectedCreneau, setSelectedCreneau] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleDelete = async (id, e) => {
        // Stop la propagation pour eviter d'ouvrir la modale au clic sur la poubelle
        e.stopPropagation();

        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau ? S'il est associé à un tournage, le lien sera rompu.")) {
            try {
                await api.delete(`/creneaux/${id}`);
                setCreneaux(prev => prev.filter(c => c._id !== id));
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert(err.response?.data?.message || "Erreur lors de la suppression du créneau.");
            }
        }
    };

    const handleSelectCreneau = (creneau) => {
        setSelectedCreneau(creneau);
        setEditFormData({
            objet: creneau.objet || '',
            date_debut: creneau.date_debut ? new Date(creneau.date_debut).toISOString().slice(0, 16) : '',
            date_fin: creneau.date_fin ? new Date(creneau.date_fin).toISOString().slice(0, 16) : '',
            statut: creneau.statut || 'Disponible'
        });
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!selectedCreneau) return;

        try {
            setIsSubmitting(true);
            const response = await api.put(`/creneaux/${selectedCreneau._id}`, editFormData);

            // Mise a jour locale de la liste
            setCreneaux(prev => prev.map(c => c._id === selectedCreneau._id ? (response.data || { ...c, ...editFormData }) : c));
            setIsModalOpen(false);
            setSelectedCreneau(null);
        } catch (err) {
            console.error("Erreur lors de la mise à jour :", err);
            alert(err.response?.data?.message || "Erreur lors de la modification du créneau.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
        if (!statut) return { text: 'Disponible', classe: 'bg-emerald-50 text-emerald-700 border border-emerald-100', point: 'bg-emerald-500' };
        const normalized = statut.toLowerCase().trim();
        if (normalized.includes('reserve') || normalized.includes('réservé')) {
            return { text: 'Réservé', classe: 'bg-amber-50 text-amber-700 border border-amber-100', point: 'bg-amber-500' };
        }
        return { text: 'Disponible', classe: 'bg-emerald-50 text-emerald-700 border border-emerald-100', point: 'bg-emerald-500' };
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3e52b7]"></div>
            <span className="ml-3 text-slate-500 text-sm font-medium">Chargement des créneaux...</span>
        </div>
    );

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen flex-1">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <CalendarClock size={24} className="text-[#3e52b7]" />
                        Calendrier créneaux
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {creneaux.length} créneau{creneaux.length > 1 ? 'x' : ''} enregistré{creneaux.length > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {creneaux.length === 0 ? (
                    <div className="p-12 text-center">
                        <CalendarClock size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Aucun créneau enregistré pour le moment.</p>
                        <p className="text-slate-400 text-sm mt-1">Réservez un créneau depuis la page Tournages.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Heure début</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Heure fin</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Objet</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Intervenant</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tournage lié</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {creneaux.map((c) => {
                                const badge = getStatutBadge(c.statut);
                                return (
                                    <tr
                                        key={c._id}
                                        onClick={() => handleSelectCreneau(c)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {formatDate(c.date_debut)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatHeure(c.date_debut)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatHeure(c.date_fin)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {c.objet || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {c.intervenant_id
                                                ? `${c.intervenant_id.prenom || ''} ${c.intervenant_id.nom || ''}`.trim()
                                                : '—'
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {c.tournage_id ? (
                                                <span className="flex items-center gap-1.5 text-[#3e52b7] font-medium">
                                                    <Link size={13} />
                                                    {c.tournage_id.titre || 'Lié'}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">—</span>
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
                                                onClick={(e) => handleDelete(c._id, e)}
                                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Supprimer le créneau"
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

            {/* Modal d'édition/détail du créneau */}
            {isModalOpen && selectedCreneau && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900 text-lg">Détails du créneau</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                                    Objet / Motif
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.objet}
                                    onChange={(e) => setEditFormData({ ...editFormData, objet: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-[#3e52b7]/10 focus:border-[#3e52b7]"
                                    placeholder="Ex: Créneau de tournage"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                                        Date & heure début
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={editFormData.date_debut}
                                        onChange={(e) => setEditFormData({ ...editFormData, date_debut: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-[#3e52b7]/10 focus:border-[#3e52b7]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                                        Date & heure fin
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={editFormData.date_fin}
                                        onChange={(e) => setEditFormData({ ...editFormData, date_fin: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-[#3e52b7]/10 focus:border-[#3e52b7]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                                    Statut
                                </label>
                                <select
                                    value={editFormData.statut}
                                    onChange={(e) => setEditFormData({ ...editFormData, statut: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-[#3e52b7]/10 focus:border-[#3e52b7]"
                                >
                                    <option value="Disponible">Disponible</option>
                                    <option value="Réservé">Réservé</option>
                                </select>
                            </div>

                            {selectedCreneau.intervenant_id && (
                                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                                    <span className="font-semibold text-slate-800">Intervenant : </span>
                                    {selectedCreneau.intervenant_id.prenom} {selectedCreneau.intervenant_id.nom}
                                </div>
                            )}

                            {selectedCreneau.tournage_id && (
                                <div className="p-3 bg-indigo-50/60 rounded-lg text-sm text-[#3e52b7]">
                                    <span className="font-semibold">Tournage associé : </span>
                                    {selectedCreneau.tournage_id.titre || 'Voir tournage'}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3e52b7] hover:bg-[#34449a] rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendrierCreneaux;
