import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, X, Trash2, Copy, Check, Mail, Phone } from 'lucide-react';

const Equipes = () => {
    const [membres, setMembres] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [copieId, setCopieId] = useState({ id: null, type: null });

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

    const membresFiltres = membres.filter((m) => {
        const nomComplet = `${m.prenom} ${m.nom}`.toLowerCase();
        return nomComplet.includes(recherche.toLowerCase()) || m.role?.toLowerCase().includes(recherche.toLowerCase());
    });

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

    const handleCopy = (text, id, type, e) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopieId({ id, type });
        setTimeout(() => setCopieId({ id: null, type: null }), 1200);
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium text-center">Chargement des données...</div>;

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen flex-1">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Équipe</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {membresFiltres.length} sur {membres.length} membres enregistrés
                    </p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={16} />
                    <span>Ajouter un membre</span>
                </button>
            </div>

            {/* Recherche */}
            <div className="relative max-w-sm mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher un membre, un rôle..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] transition-colors shadow-sm"
                />
            </div>

            {/* Tableau */}
            {membresFiltres.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium shadow-sm">
                    Aucun membre ne correspond à votre recherche.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Nom</th>
                                    <th className="px-6 py-4">Rôle</th>
                                    <th className="px-6 py-4">Marque</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {membresFiltres.map((m) => (
                                    <tr
                                        key={m._id}
                                        onClick={() => handleOpenEditModal(m)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#3e52b7] font-semibold text-xs flex items-center justify-center shrink-0">
                                                    {m.prenom?.charAt(0).toUpperCase()}{m.nom?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-900">{m.prenom} {m.nom}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-[#3e52b7]">
                                                {m.role || 'Non défini'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {m.marque?.nom || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {m.actif ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {m.telephone && (
                                                    <button
                                                        onClick={(e) => handleCopy(m.telephone, m._id, 'telephone', e)}
                                                        className="text-slate-400 hover:text-[#3e52b7] p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                                        title="Copier le téléphone"
                                                    >
                                                        {copieId.id === m._id && copieId.type === 'telephone' ? <Check size={14} className="text-emerald-600" /> : <Phone size={14} />}
                                                    </button>
                                                )}
                                                {m.email && (
                                                    <button
                                                        onClick={(e) => handleCopy(m.email, m._id, 'email', e)}
                                                        className="text-slate-400 hover:text-[#3e52b7] p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                                        title="Copier l'email"
                                                    >
                                                        {copieId.id === m._id && copieId.type === 'email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modale d'ajout/modification */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isEditing ? "Modifier le membre" : "Ajouter un membre"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Prénom</label>
                                    <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nom</label>
                                    <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        <Mail size={11} className="inline mr-1 -mt-0.5" />Email
                                    </label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        <Phone size={11} className="inline mr-1 -mt-0.5" />Téléphone
                                    </label>
                                    <input type="text" placeholder="Ex: 06 12 34 56 78" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Rôle</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Photographe, Monteur..."
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Marque (École)</label>
                                    <select
                                        value={formData.marque}
                                        onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7]"
                                    >
                                        <option value="">Aucune</option>
                                        {marques.map(m => (
                                            <option key={m._id} value={m._id}>{m.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input type="checkbox" id="actif" checked={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.checked })} className="w-4 h-4 text-[#3e52b7] border-slate-300 rounded focus:ring-[#3e52b7]" />
                                <label htmlFor="actif" className="text-sm font-semibold text-slate-700">Compte actif</label>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
                                <div>
                                    {isEditing && (
                                        <button type="button" onClick={handleDelete} className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors">
                                            <Trash2 size={16} /> Supprimer
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                        Annuler
                                    </button>
                                    <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-[#3e52b7] hover:bg-[#34449a] rounded-lg shadow-sm transition-colors">
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
