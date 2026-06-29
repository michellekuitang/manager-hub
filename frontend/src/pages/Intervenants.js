import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, X, Copy, Check, Trash2 } from 'lucide-react';

const Intervenants = () => {
    const [intervenants, setIntervenants] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);

    const [recherche, setRecherche] = useState('');
    const [filtreMarque, setFiltreMarque] = useState('Tous');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [emailCopieId, setEmailCopieId] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        role: '',
        marque_id: '',
        actif: true
    });

    const fetchIntervenants = async () => {
        try {
            setLoading(true);
            const res = await api.get('/intervenants');
            setIntervenants(res.data);
        } catch (err) {
            console.error("Erreur lors de la recuperation des intervenants :", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarques = async () => {
        try {
            const res = await api.get('/marques');
            setMarques(res.data);
        } catch (err) {
            console.error("Erreur lors de la recuperation des marques :", err);
        }
    };

    useEffect(() => {
        fetchIntervenants();
        fetchMarques();
    }, []);

    // Liste des marques utilisees pour le filtre, basee sur les intervenants existants
    const marquesFiltre = ['Tous', ...new Set(
        intervenants
            .map(i => i.marque_id?.nom)
            .filter(Boolean)
    )];

    const intervenantsFiltres = intervenants.filter((i) => {
        const nomComplet = `${i.prenom} ${i.nom}`.toLowerCase();
        const correspondNom = nomComplet.includes(recherche.toLowerCase());
        const correspondMarque = filtreMarque === 'Tous' || i.marque_id?.nom === filtreMarque;
        return correspondNom && correspondMarque;
    });

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            role: '',
            marque_id: marques[0]?._id || '',
            actif: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (intervenant) => {
        setIsEditing(true);
        setCurrentId(intervenant._id);
        setFormData({
            nom: intervenant.nom || '',
            prenom: intervenant.prenom || '',
            email: intervenant.email || '',
            role: intervenant.role || '',
            marque_id: intervenant.marque_id?._id || '',
            actif: intervenant.actif !== undefined ? intervenant.actif : true
        });
        setIsModalOpen(true);
    };

    const handleCopyEmail = (email, id, e) => {
        e.stopPropagation();
        if (!email) return;
        navigator.clipboard.writeText(email);
        setEmailCopieId(id);
        setTimeout(() => setEmailCopieId(null), 1500);
    };

    const handleDelete = async () => {
        if (window.confirm("Etes-vous sur de vouloir supprimer cet intervenant ?")) {
            try {
                await api.delete(`/intervenants/${currentId}`);
                setIsModalOpen(false);
                fetchIntervenants();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                alert("Impossible de supprimer l'intervenant.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/intervenants/${currentId}`, formData);
            } else {
                await api.post('/intervenants', formData);
            }
            setIsModalOpen(false);
            fetchIntervenants();
        } catch (err) {
            console.error("Erreur lors de l'enregistrement :", err);
            alert("Une erreur est survenue lors de l'enregistrement.");
        }
    };

    if (loading) return <div className="p-6 text-gray-500 font-medium">Chargement des intervenants...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]">Intervenants</h1>
                    <p className="text-sm text-gray-500 mt-1">{intervenantsFiltres.length} sur {intervenants.length} profils enregistres</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span>Ajouter un intervenant</span>
                </button>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un intervenant..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <select
                    value={filtreMarque}
                    onChange={(e) => setFiltreMarque(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                    {marquesFiltre.map((nom) => (
                        <option key={nom} value={nom}>{nom}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {intervenantsFiltres.length === 0 ? (
                    <p className="text-gray-500 font-medium text-center p-12">Aucun intervenant ne correspond a votre recherche.</p>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marque</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {intervenantsFiltres.map((i) => (
                                <tr
                                    key={i._id}
                                    onClick={() => handleOpenEditModal(i)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {i.prenom?.charAt(0)}{i.nom?.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{i.prenom} {i.nom}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-sm text-gray-600">{i.email || '—'}</td>
                                    <td className="px-6 py-3.5">
                                        {i.role ? (
                                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                                                {i.role}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-3.5 text-sm text-gray-600">{i.marque_id?.nom || '—'}</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <button
                                            onClick={(e) => handleCopyEmail(i.email, i._id, e)}
                                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            title="Copier l'email"
                                        >
                                            {emailCopieId === i._id ? (
                                                <Check size={15} className="text-green-600" />
                                            ) : (
                                                <Copy size={15} />
                                            )}
                                        </button>
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
                                {isEditing ? 'Modifier l\'intervenant' : 'Nouvel intervenant'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Prenom
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.prenom}
                                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="prenom.nom@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Acteur, Figurant, Voix off..."
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Marque (ecole)
                                </label>
                                <select
                                    required
                                    value={formData.marque_id}
                                    onChange={(e) => setFormData({ ...formData, marque_id: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                >
                                    <option value="" disabled>Choisir une marque</option>
                                    {marques.map((m) => (
                                        <option key={m._id} value={m._id}>{m.nom}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="actif"
                                    checked={formData.actif}
                                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="actif" className="text-sm text-gray-700">
                                    Intervenant actif
                                </label>
                            </div>

                            <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100 mt-6">
                                {isEditing ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={15} />
                                        Supprimer
                                    </button>
                                ) : (
                                    <span />
                                )}
                                <div className="flex gap-3">
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
                                        {isEditing ? 'Mettre a jour' : 'Sauvegarder'}
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

export default Intervenants;