import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Campagnes = () => {
    const [campagnes, setCampagnes] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Garde en mémoire la campagne cliquée pour savoir si on "Modifie" ou on "Crée"
    const [selectedCampagne, setSelectedCampagne] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        marque_id: '',
        type: 'Google Ads',
        statut: 'Brouillon',
        budget: '',
        depense: '',
        leads: '',
        clics: '',
        date_debut: '',
        date_fin: '',
        notes: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [campagnesRes, marquesRes] = await Promise.all([
                api.get('/campagnes'),
                api.get('/marques')
            ]);
            setCampagnes(campagnesRes.data);
            setMarques(marquesRes.data);
            setError('');
        } catch (err) {
            console.error("Erreur lors de la récupération des données :", err);
            setError("Impossible de charger les données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Clic sur une ligne du tableau pour modifier
    const handleRowClick = (campagne) => {
        setSelectedCampagne(campagne);
        setFormData({
            nom: campagne.nom || '',
            marque_id: campagne.marque_id?._id || campagne.marque_id || '',
            type: campagne.type || 'Google Ads',
            statut: campagne.statut || 'Brouillon',
            budget: campagne.budget !== undefined ? campagne.budget : '',
            depense: campagne.depense !== undefined ? campagne.depense : '',
            leads: campagne.leads !== undefined ? campagne.leads : '',
            clics: campagne.clics !== undefined ? campagne.clics : '',
            date_debut: campagne.date_debut ? new Date(campagne.date_debut).toISOString().split('T')[0] : '',
            date_fin: campagne.date_fin ? new Date(campagne.date_fin).toISOString().split('T')[0] : '',
            notes: campagne.notes || ''
        });
        setIsModalOpen(true);
    };

    // Reset et fermeture du modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCampagne(null);
        setFormData({
            nom: '',
            marque_id: '',
            type: 'Google Ads',
            statut: 'Brouillon',
            budget: '',
            depense: '',
            leads: '',
            clics: '',
            date_debut: '',
            date_fin: '',
            notes: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                budget: formData.budget !== '' ? Number(formData.budget) : 0,
                depense: formData.depense !== '' ? Number(formData.depense) : 0,
                leads: formData.leads !== '' ? Number(formData.leads) : 0,
                clics: formData.clics !== '' ? Number(formData.clics) : 0,
                date_debut: formData.date_debut || null,
                date_fin: formData.date_fin || null
            };

            if (selectedCampagne) {
                // Modification d'une campagne existante
                await api.put(`/campagnes/${selectedCampagne._id}`, payload);
            } else {
                // Création d'une nouvelle campagne
                await api.post('/campagnes', payload);
            }

            await fetchData();
            handleCloseModal();
        } catch (err) {
            console.error("Erreur lors de l'enregistrement :", err);
            alert(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        }
    };

    const handleDelete = async () => {
        if (!selectedCampagne) return;
        
        if (window.confirm(`Es-tu sûre de vouloir supprimer la campagne "${selectedCampagne.nom}" ?`)) {
            try {
                await api.delete(`/campagnes/${selectedCampagne._id}`);
                setCampagnes(prev => prev.filter(c => c._id !== selectedCampagne._id));
                handleCloseModal();
            } catch (err) {
                console.error("Erreur de suppression :", err);
                alert("Erreur lors de la suppression de la campagne.");
            }
        }
    };

    // Calculs statistiques
    const activeCount = campagnes.filter(c => c.statut === 'Active').length;
    const totalSpent = campagnes.reduce((sum, c) => sum + (c.depense || 0), 0);
    const totalLeadsCount = campagnes.reduce((sum, c) => sum + (c.leads || 0), 0);
    const avgCPL = totalLeadsCount > 0 ? (totalSpent / totalLeadsCount) : 0;

    // Formateurs de données
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '0€';
        return `${value}€`;
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
    };

    const displayCampaignDates = (start, end) => {
        const startFormatted = formatDateShort(start);
        const endFormatted = formatDateShort(end);
        if (startFormatted && endFormatted) return `${startFormatted} → ${endFormatted}`;
        if (startFormatted) return `Depuis le ${startFormatted}`;
        return '-';
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b51a3]"></div>
                <span className="ml-3 text-slate-500 text-sm font-medium mt-4">Chargement...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 max-w-7xl font-sans bg-[#f8fafc]/40 min-h-screen">
            {/* Titre & Bouton d'action */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campagnes</h1>
                    <p className="text-slate-400 text-sm mt-1">Google Ads & publicité</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedCampagne(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center px-5 py-2.5 bg-[#3b51a3] hover:bg-[#2f4185] text-white text-sm font-semibold rounded-lg shadow-sm transition duration-150"
                >
                    <span className="mr-2 text-lg font-medium">+</span> Nouvelle campagne
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* --- CARTES KPI COMPACTES --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 max-w-5xl">
                {/* ACTIVES */}
                <div className="bg-white py-4 px-5 rounded-2xl border border-slate-100/90 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actives</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{activeCount}</p>
                    </div>
                    <div className="p-2.5 bg-indigo-50/60 text-[#3b51a3] rounded-xl flex items-center justify-center w-10 h-10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                </div>

                {/* BUDGET DÉPENSÉ */}
                <div className="bg-white py-4 px-5 rounded-2xl border border-slate-100/90 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Dépensé</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalSpent.toLocaleString('fr-FR')}€</p>
                    </div>
                    <div className="p-2.5 bg-indigo-50/60 text-[#3b51a3] rounded-xl flex items-center justify-center w-10 h-10">
                        <span className="text-base font-extrabold">$</span>
                    </div>
                </div>

                {/* LEADS TOTAL */}
                <div className="bg-white py-4 px-5 rounded-2xl border border-slate-100/90 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Total</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeadsCount.toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="p-2.5 bg-indigo-50/60 text-[#3b51a3] rounded-xl flex items-center justify-center w-10 h-10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <circle cx="12" cy="12" r="6" strokeWidth="2" />
                            <circle cx="12" cy="12" r="2" strokeWidth="2" fill="currentColor" />
                        </svg>
                    </div>
                </div>

                {/* COÛT / LEAD MOYEN */}
                <div className="bg-white py-4 px-5 rounded-2xl border border-slate-100/90 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coût/Lead Moyen</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{avgCPL.toFixed(2)}€</p>
                    </div>
                    <div className="p-2.5 bg-indigo-50/60 text-[#3b51a3] rounded-xl flex items-center justify-center w-10 h-10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* --- TABLEAU DES CAMPAGNES --- */}
            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-100">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-white text-slate-400 text-left text-xs font-normal border-b border-slate-100">
                            <th className="px-6 py-4.5">Campagne</th>
                            <th className="px-6 py-4.5">Marque</th>
                            <th className="px-6 py-4.5">Type</th>
                            <th className="px-6 py-4.5">Statut</th>
                            <th className="px-6 py-4.5">Budget</th>
                            <th className="px-6 py-4.5">Dépensé</th>
                            <th className="px-6 py-4.5">Leads</th>
                            <th className="px-6 py-4.5">CPL</th>
                            <th className="px-6 py-4.5">Dates</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {campagnes.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-12 text-center text-slate-400 bg-white">
                                    <p className="text-sm">Aucune campagne pour le moment.</p>
                                </td>
                            </tr>
                        ) : (
                            campagnes.map((campagne) => {
                                const cpl = campagne.leads > 0 ? (campagne.depense / campagne.leads).toFixed(2) : '0.00';
                                return (
                                    <tr 
                                        key={campagne._id} 
                                        onClick={() => handleRowClick(campagne)}
                                        className="hover:bg-slate-50/40 cursor-pointer transition duration-150"
                                    >
                                        <td className="px-6 py-3.5 text-sm text-slate-800 font-medium">{campagne.nom}</td>
                                        <td className="px-6 py-3.5 text-sm text-slate-600">
                                            {campagne.marque_id?.nom || '-'}
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-slate-400 lowercase">{campagne.type || 'google ads'}</td>
                                        <td className="px-6 py-3.5 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                campagne.statut === 'Active'
                                                    ? 'bg-[#e6f4ea] text-[#137333]'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {campagne.statut}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-slate-700">{formatCurrency(campagne.budget)}</td>
                                        <td className="px-6 py-3.5 text-sm text-slate-700">{formatCurrency(campagne.depense)}</td>
                                        <td className="px-6 py-3.5 text-sm text-slate-700">{campagne.leads || 0}</td>
                                        <td className="px-6 py-3.5 text-sm text-slate-700">{cpl}€</td>
                                        <td className="px-6 py-3.5 text-[13px] text-slate-400">
                                            {displayCampaignDates(campagne.date_debut, campagne.date_fin)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL : CRÉATION / MODIFICATION --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
                            <h3 className="text-[17px] font-bold text-slate-800">
                                {selectedCampagne ? 'Modifier la campagne' : 'Nouvelle campagne'}
                            </h3>
                            <button 
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 text-2xl focus:outline-none"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                            {/* Nom */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nom</label>
                                <input
                                    type="text"
                                    name="nom"
                                    required
                                    value={formData.nom}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                                    placeholder="Nom de la campagne"
                                />
                            </div>

                            {/* Marque & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Marque</label>
                                    <select
                                        name="marque_id"
                                        required
                                        value={formData.marque_id}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                    >
                                        <option value="">Choisir</option>
                                        {marques.map(m => (
                                            <option key={m._id} value={m._id}>{m.nom}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                    >
                                        <option value="Google Ads">Google Ads</option>
                                        <option value="Facebook Ads">Facebook Ads</option>
                                        <option value="TikTok Ads">TikTok Ads</option>
                                    </select>
                                </div>
                            </div>

                            {/* Statut & Budget */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Statut</label>
                                    <select
                                        name="statut"
                                        value={formData.statut}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                    >
                                        <option value="Brouillon">Brouillon</option>
                                        <option value="Active">Active</option>
                                        <option value="Terminée">Terminée</option>
                                        <option value="A venir">A venir</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Budget (€)</label>
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                        placeholder="Ex: 10"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Dépensé & Leads */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Dépensé (€)</label>
                                    <input
                                        type="number"
                                        name="depense"
                                        value={formData.depense}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                        placeholder="Ex: 8"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Leads</label>
                                    <input
                                        type="number"
                                        name="leads"
                                        value={formData.leads}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                        placeholder="Ex: 250"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Clics & Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Clics</label>
                                    <input
                                        type="number"
                                        name="clics"
                                        value={formData.clics}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                        placeholder="Ex: 1200"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date début</label>
                                    <input
                                        type="date"
                                        name="date_debut"
                                        value={formData.date_debut}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date fin</label>
                                    <input
                                        type="date"
                                        name="date_fin"
                                        value={formData.date_fin}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition resize-none"
                                    placeholder="Ajouter des remarques..."
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-between items-center pt-5 border-t border-slate-100">
                                {/* Bouton de suppression qui n'apparaît qu'en mode MODIFICATION */}
                                {selectedCampagne ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition"
                                    >
                                        Supprimer la campagne
                                    </button>
                                ) : (
                                    <div /> /* Div vide pour garder le bouton Sauvegarder à droite */
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-[#3b51a3] hover:bg-[#2f4185] text-white rounded-xl text-sm font-semibold shadow-sm transition"
                                    >
                                        Sauvegarder
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

export default Campagnes;