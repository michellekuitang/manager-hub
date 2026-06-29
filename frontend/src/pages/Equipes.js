import React, { useState, useEffect } from 'react';
import api from '../services/api'; // On importe ton instance personnalisée
import { Plus, Search, X, Trash2 } from 'lucide-react';

const Equipes = () => {
    const [membres, setMembres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        role: 'Community Manager',
        actif: true
    });

    const fetchMembres = async () => {
        try {
            setLoading(true);
            // On utilise 'api' avec la route relative (le baseURL s'occupe du reste)
            const res = await api.get('/equipe');
            setMembres(res.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des membres :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembres();
    }, []);

    const membresFiltrés = membres.filter((m) => {
        const nomComplet = `${m.prenom} ${m.nom}`.toLowerCase();
        return nomComplet.includes(recherche.toLowerCase()) || m.email.toLowerCase().includes(recherche.toLowerCase());
    });

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ nom: '', prenom: '', email: '', role: 'Community Manager', actif: true });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (membre) => {
        setIsEditing(true);
        setCurrentId(membre._id);
        setFormData({
            nom: membre.nom || '',
            prenom: membre.prenom || '',
            email: membre.email || '',
            role: membre.role || 'Community Manager',
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
            fetchMembres();
        } catch (err) {
            console.error("Erreur Axios complète :", err);
            
            // Récupérer le message précis renvoyé par Express ou MongoDB
            const messageServeur = err.response?.data?.message || err.message;
            const statutCode = err.response?.status ? `(Code ${err.response.status})` : "";
            
            alert(`Erreur du serveur ${statutCode} : ${messageServeur}`);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Supprimer ${formData.prenom} ${formData.nom} de l'équipe ?`)) {
            try {
                // Remplacement par api.delete
                await api.delete(`/equipe/${currentId}`);
                setIsModalOpen(false);
                fetchMembres();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert("Une erreur est survenue lors de la suppression.");
            }
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium text-center">Chargement des membres de l'équipe...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]">Équipe</h1>
                    <p className="text-sm text-gray-500 mt-1">{membresFiltrés.length} membres enregistrés</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Ajouter un membre</span>
                </button>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un membre de l'équipe..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {membresFiltrés.length === 0 ? (
                    <p className="text-gray-500 font-medium text-center p-12">Aucun membre trouvé.</p>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
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
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {m.prenom?.charAt(0).toUpperCase()}{m.nom?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{m.prenom} {m.nom}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-sm text-gray-600">{m.email}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                                            {m.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {m.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditing ? "Modifier le membre" : "Ajouter un membre"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nom</label>
                                    <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Prénom</label>
                                    <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rôle</label>
                                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500">
                                    <option value="Administrateur">Administrateur</option>
                                    <option value="Community Manager">Community Manager</option>
                                    <option value="Modérateur">Modérateur</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="actif" checked={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <label htmlFor="actif" className="text-sm text-gray-700 selection:bg-transparent">Compte actif</label>
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