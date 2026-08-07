import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, X, Copy, Check, Trash2, Mail, Phone } from 'lucide-react';

const Intervenants = () => {
    const [intervenants, setIntervenants] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);

    const [recherche, setRecherche] = useState('');
    const [filtreMarque, setFiltreMarque] = useState('Tous');

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
        marque_id: '',
        actif: true
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resIntervenants, resMarques] = await Promise.all([
                api.get('/intervenants'),
                api.get('/marques')
            ]);
            setIntervenants(resIntervenants.data);
            setMarques(resMarques.data);
        } catch (err) {
            console.error("Erreur de chargement des données :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const marquesFiltre = ['Tous', ...new Set(intervenants.map(i => i.marque_id?.nom).filter(Boolean))];

    const intervenantsFiltres = intervenants.filter((i) => {
        const nomComplet = `${i.prenom} ${i.nom}`.toLowerCase();
        const correspondNom = nomComplet.includes(recherche.toLowerCase()) || i.role?.toLowerCase().includes(recherche.toLowerCase());
        const correspondMarque = filtreMarque === 'Tous' || i.marque_id?.nom === filtreMarque;
        return correspondNom && correspondMarque;
    });

    const handleOpenCreate = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            role: '',
            marque_id: marques[0]?._id || '',
            actif: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (intervenant) => {
        setIsEditing(true);
        setCurrentId(intervenant._id);
        
        // Gestion de la double compatibilité pour l'affichage dans la modale
        const telValue = intervenant.telephone || intervenant.phone || intervenant.tel || '';
        
        setFormData({
            nom: intervenant.nom || '',
            prenom: intervenant.prenom || '',
            email: intervenant.email || '',
            telephone: telValue,
            role: intervenant.role || '',
            marque_id: intervenant.marque_id?._id || '',
            actif: intervenant.actif !== undefined ? intervenant.actif : true
        });
        setIsModalOpen(true);
    };

    const handleCopy = (text, id, type, e) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopieId({ id, type });
        setTimeout(() => setCopieId({ id: null, type: null }), 1200);
    };

    const handleDelete = async () => {
        if (window.confirm("Supprimer cet intervenant ?")) {
            try {
                await api.delete(`/intervenants/${currentId}`);
                setIsModalOpen(false);
                fetchData();
            } catch (err) {
                console.error(err);
                alert("Erreur lors de la suppression.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // On prépare un payload qui contient les deux clés possibles (telephone et phone) 
        // pour être sûr à 100% que le backend intercepte la bonne variable
        const payload = {
            ...formData,
            phone: formData.telephone, // Duplication de sécurité pour le backend
            tel: formData.telephone
        };

        try {
            if (isEditing) {
                await api.put(`/intervenants/${currentId}`, payload);
            } else {
                await api.post('/intervenants', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement.");
        }
    };

    if (loading) return <div className="p-12 text-slate-400 text-sm font-medium text-center tracking-wide">Chargement...</div>;

    return (
        <div className="p-6 md:p-10 bg-[#f8fafc] min-h-screen flex-1 w-full">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intervenants</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {intervenantsFiltres.length} sur {intervenants.length} profils enregistrés
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                    <Plus size={16} />
                    <span>Ajouter un intervenant</span>
                </button>
            </div>

            {/* Barre de Recherche et Filtre */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-3xl">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un intervenant..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] transition-all shadow-sm"
                    />
                </div>

                <select
                    value={filtreMarque}
                    onChange={(e) => setFiltreMarque(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#3e52b7] cursor-pointer min-w-[140px] shadow-sm"
                >
                    {marquesFiltre.map((nom) => (
                        <option key={nom} value={nom}>{nom === 'Tous' ? 'Tous' : nom}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {intervenantsFiltres.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center text-sm text-slate-400 bg-white">
                    Aucun intervenant trouvé.
                </div>
            ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Nom</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Téléphone</th>
                                    <th className="px-6 py-4">Rôle</th>
                                    <th className="px-6 py-4">Marque</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                {intervenantsFiltres.map((i) => {
                                    // Extraction sécurisée du numéro de téléphone
                                    const numeroTel = i.telephone || i.phone || i.tel;

                                    return (
                                        <tr
                                            key={i._id}
                                            onClick={() => handleOpenEdit(i)}
                                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                                        >
                                            {/* Colonne Identité */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#3e52b7] font-semibold text-xs flex items-center justify-center tracking-wider shrink-0">
                                                        {i.prenom?.charAt(0).toUpperCase()}{i.nom?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-900">
                                                        {i.prenom} {i.nom}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {i.email || '—'}
                                            </td>

                                            {/* Colonne Téléphone (Correction Fallback) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {numeroTel || '—'}
                                            </td>

                                            {/* Rôle */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-[#3e52b7]">
                                                    {i.role || 'Intervenant'}
                                                </span>
                                            </td>

                                            {/* Marque */}
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {i.marque_id?.nom || '—'}
                                            </td>

                                            {/* Actions de copie */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {numeroTel && (
                                                        <button
                                                            onClick={(e) => handleCopy(numeroTel, i._id, 'telephone', e)}
                                                            className="text-slate-400 hover:text-[#3e52b7] p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                                            title="Copier le numéro"
                                                        >
                                                            {copieId.id === i._id && copieId.type === 'telephone' ? <Check size={14} className="text-green-600" /> : <Phone size={14} />}
                                                        </button>
                                                    )}
                                                    {i.email && (
                                                        <button
                                                            onClick={(e) => handleCopy(i.email, i._id, 'email', e)}
                                                            className="text-slate-400 hover:text-[#3e52b7] p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                                            title="Copier l'email"
                                                        >
                                                            {copieId.id === i._id && copieId.type === 'email' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modale d'édition/création */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-xl overflow-hidden">
                        
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-sm font-bold text-slate-900">
                                {isEditing ? "Modifier l'intervenant" : "Ajouter un intervenant"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nom</label>
                                    <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7] transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prénom</label>
                                    <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7] transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7] transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Téléphone</label>
                                    <input type="text" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7] transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rôle</label>
                                    <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7] transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Marque / École</label>
                                    <select required value={formData.marque_id} onChange={(e) => setFormData({ ...formData, marque_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#3e52b7] transition-colors cursor-pointer">
                                        <option value="" disabled>Choisir une marque</option>
                                        {marques.map((m) => (
                                            <option key={m._id} value={m._id}>{m.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="actif" checked={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.checked })} className="w-3.5 h-3.5 rounded border-slate-300 text-[#3e52b7] focus:ring-[#3e52b7]" />
                                <label htmlFor="actif" className="text-xs text-slate-600 select-none cursor-pointer font-medium">Profil actif et disponible</label>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-6">
                                <div>
                                    {isEditing && (
                                        <button type="button" onClick={handleDelete} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                                            <Trash2 size={14} /> Supprimer
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                                        Annuler
                                    </button>
                                    <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#3e52b7] hover:bg-[#34449a] rounded-lg transition-colors shadow-sm">
                                        {isEditing ? 'Enregistrer' : 'Créer'}
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