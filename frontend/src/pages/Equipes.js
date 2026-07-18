import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, X, Trash2, Copy, Grid, List, Users, CheckCircle } from 'lucide-react';

const Equipes = () => {
    const [membres, setMembres] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: '',
        marque: '',
        actif: true
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [membresRes, marquesRes] = await Promise.all([
                api.get('/equipe'),
                api.get('/marques')
            ]);
            setMembres(membresRes.data);
            setMarques(marquesRes.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des données :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const membresFiltrés = membres.filter((m) => {
        const nomComplet = `${m.prenom} ${m.nom}`.toLowerCase();
        return nomComplet.includes(recherche.toLowerCase()) || m.role?.toLowerCase().includes(recherche.toLowerCase());
    });

    // Statistiques épurées
    const totalMembres = membres.length;
    const membresActifs = membres.filter(m => m.actif).length;

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ nom: '', prenom: '', email: '', telephone: '', role: '', marque: '', actif: true });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (membre) => {
        setIsEditing(true);
        setCurrentId(membre._id);
        setFormData({
            nom: membre.nom || '',
            prenom: membre.prenom || '',
            email: membre.email || '',
            telephone: membre.telephone || '',
            role: membre.role || '',
            marque: membre.marque?._id || membre.marque || '',
            actif: membre.actif !== undefined ? membre.actif : true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/equipe/${currentId}`, formData);
            } else {
                await api.post('/equipe', formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Erreur :", err);
            alert(`Erreur : ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Supprimer ${formData.prenom} ${formData.nom} ?`)) {
            try {
                await api.delete(`/equipe/${currentId}`);
                setIsModalOpen(false);
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const copierTelephone = (e, telephone) => {
        e.stopPropagation();
        if (!telephone) return alert("Aucun numéro renseigné.");
        navigator.clipboard.writeText(telephone);
        alert(`Numéro ${telephone} copié !`);
    };

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium text-center">Chargement des données...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]">Équipe</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les membres de votre organisation et leurs accès.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Ajouter un membre</span>
                </button>
            </div>

            {/* Statistiques d'équipe - Passage en 2 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users size={22} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Effectif Total</p>
                        <p className="text-2xl font-bold text-gray-900">{totalMembres}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><CheckCircle size={22} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Membres Actifs</p>
                        <p className="text-2xl font-bold text-gray-900">{membresActifs}</p>
                    </div>
                </div>
            </div>

            {/* Filtres & Switcher de Vue */}
            <div className="flex justify-between items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un membre, un rôle..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                    />
                </div>
                
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shadow-inner">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Vue en Grille"
                    >
                        <Grid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Vue en Tableau"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Contenu principal */}
            {membresFiltrés.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 font-medium shadow-sm">
                    Aucun membre ne correspond à votre recherche.
                </div>
            ) : viewMode === 'grid' ? (
                /* --- VUE EN GRILLE --- */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {membresFiltrés.map((m) => (
                        <div 
                            key={m._id}
                            onClick={() => handleOpenEditModal(m)}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all relative cursor-pointer flex flex-col justify-between group"
                        >
                            <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${m.actif ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                                {m.actif ? 'Actif' : 'Inactif'}
                            </span>

                            <div className="flex flex-col items-center text-center mt-2">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-100 mb-3 group-hover:scale-105 transition-transform">
                                    {m.prenom?.charAt(0).toUpperCase()}{m.nom?.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-gray-900 text-base line-clamp-1">{m.prenom} {m.nom}</h3>
                                <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg mt-2 inline-block">
                                    {m.role || 'Non défini'}
                                </p>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-5 space-y-2.5 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">École :</span>
                                    <span className="font-medium text-gray-800">{m.marque?.nom || 'Aucune'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Téléphone :</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-gray-800">{m.telephone || '-'}</span>
                                        {m.telephone && (
                                            <button 
                                                onClick={(e) => copierTelephone(e, m.telephone)}
                                                className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                                                title="Copier le numéro"
                                            >
                                                <Copy size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email :</span>
                                    <span className="font-medium text-gray-800 truncate max-w-[150px]" title={m.email}>{m.email}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* --- VUE EN TABLEAU CLASSIQUE --- */
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Marque</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {membresFiltrés.map((m) => (
                                <tr
                                    key={m._id}
                                    onClick={() => handleOpenEditModal(m)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {m.prenom?.charAt(0).toUpperCase()}{m.nom?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{m.prenom} {m.nom}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700">
                                            {m.role || 'Non défini'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-sm text-gray-600">{m.telephone || '-'}</td>
                                    <td className="px-6 py-3.5 text-sm text-gray-600">{m.marque?.nom || 'Aucune'}</td>
                                    <td className="px-6 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {m.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <button 
                                            onClick={(e) => copierTelephone(e, m.telephone)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                            title="Copier le numéro"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modale d'ajout/modification */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditing ? "Modifier le membre" : "Ajouter un membre"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nom</label>
                                    <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Prénom</label>
                                    <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Téléphone</label>
                                    <input type="text" placeholder="Ex: 06 12 34 56 78" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rôle</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Photographe, Monteur..." 
                                        value={formData.role} 
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Marque (École)</label>
                                    <select 
                                        value={formData.marque} 
                                        onChange={(e) => setFormData({ ...formData, marque: e.target.value })} 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Sélectionner une marque --</option>
                                        {marques.map(m => (
                                            <option key={m._id} value={m._id}>{m.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="actif" checked={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <label htmlFor="actif" className="text-sm font-semibold text-gray-700 selection:bg-transparent">Compte actif</label>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-6">
                                <div>
                                    {isEditing && (
                                        <button type="button" onClick={handleDelete} className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors">
                                            <Trash2 size={16} /> Supprimer
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        Annuler
                                    </button>
                                    <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-[#3b82f6] hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
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

export default Equipes;