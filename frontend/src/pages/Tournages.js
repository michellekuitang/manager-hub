import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Calendar, Plus, X, ChevronLeft, ChevronRight, 
    CheckCircle2, Clock, Video, Trash2 
} from 'lucide-react';

// Helper de normalisation universel pour régler le problème d'accents et de casse
const normalizeStatut = (statutRaw) => {
    if (!statutRaw) return 'A faire';
    const s = String(statutRaw).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (s.includes('faire')) return 'A faire';
    if (s.includes('cours')) return 'En cours';
    if (s.includes('valider')) return 'A valider';
    if (s.includes('valide')) return 'Valide';
    if (s.includes('publi')) return 'Publie';
    return 'A faire'; // S\u00e9curit\u00e9 : fallback sur "A faire" et NON "Publi\u00e9"
};

const STATUTS_CONFIG = {
    'A faire': { label: '\u00c0 faire', style: 'bg-slate-50 text-slate-600 border-slate-200' },
    'En cours': { label: 'En cours', style: 'bg-[#eff6ff] text-blue-600 border-blue-200' },
    'A valider': { label: '\u00c0 valider', style: 'bg-[#fffbeb] text-amber-600 border-amber-200' },
    'Valide': { label: 'Valid\u00e9', style: 'bg-teal-50 text-teal-600 border-teal-200' },
    'Publie': { label: 'Publi\u00e9', style: 'bg-[#f0fdf4] text-emerald-600 border-emerald-200' }
};

// Helper pour obtenir le lundi de la semaine d'une date donnée
const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustement si dimanche
    return new Date(date.setDate(diff));
};

const Tournages = () => {
    const [tournages, setTournages] = useState([]);
    const [marques, setMarques] = useState([]);
    const [intervenants, setIntervenants] = useState([]);
    const [creneaux, setCreneaux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [newCreatedCreneauId, setNewCreatedCreneauId] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        titre: '',
        marque_id: '',
        intervenant_id: '',
        creneau_id: '',
        statut: 'A faire',
        date_tournage: '',
        lieu: '',
        type_contenu: 'presentation',
        plateforme: 'Instagram',
        priorite: 'Moyenne',
        date_publication_prevue: '',
        brief: '',
        notes_internes: ''
    });

    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);
    const [bookingError, setBookingError] = useState('');
    
    // Gestion dynamique de la semaine de réservation
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
    const [selectedDateObj, setSelectedDateObj] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    
    const [bookingForm, setBookingForm] = useState({
        intervenant_id: '',
        objet: ''
    });

    const availableSlots = [
        '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30'
    ];

    // Génération dynamique des 5 jours (Lundi -> Vendredi) de la semaine active
    const weekDays = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        
        const labelsMap = ['DIM.', 'LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.'];
        return {
            label: labelsMap[d.getDay()],
            num: String(d.getDate()).padStart(2, '0'),
            fullDate: d
        };
    });

    // Navigation semaines
    const handlePreviousWeek = () => {
        setCurrentWeekStart(prev => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 7);
            return next;
        });
    };

    const handleNextWeek = () => {
        setCurrentWeekStart(prev => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 7);
            return next;
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resTournages, resMarques, resIntervenants, resCreneaux] = await Promise.all([
                api.get('/tournages'),
                api.get('/marques'),
                api.get('/intervenants'),
                api.get('/creneaux')
            ]);
            setTournages(resTournages.data);
            setMarques(resMarques.data);
            setIntervenants(resIntervenants.data);
            setCreneaux(resCreneaux.data);
        } catch (err) {
            console.error('Erreur lors du chargement des données', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCreneau = (creneauData) => {
        if (!creneauData) return null;

        if (typeof creneauData === 'string') {
            const found = creneaux.find(c => String(c._id) === String(creneauData));
            if (!found) return null;
            creneauData = found;
        }

        if (Array.isArray(creneauData)) {
            creneauData = creneauData[0];
        }

        if (!creneauData || !creneauData.date_debut) return null;

        const dateDebut = new Date(creneauData.date_debut);
        const dateFin = new Date(creneauData.date_fin || new Date(dateDebut.getTime() + 30 * 60000));

        const optionsDate = { day: 'numeric', month: 'short' };
        const dateStr = dateDebut.toLocaleDateString('fr-FR', optionsDate).replace('.', '');
        const heureDebut = dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const heureFin = dateFin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        return `${dateStr} ${heureDebut}–${heureFin}`;
    };

    const handleSelectTournage = (t) => {
        setEditingId(t._id);
        setErrorMessage('');

        let targetCreneauId = '';
        if (t.creneau_id) {
            targetCreneauId = typeof t.creneau_id === 'object' ? t.creneau_id._id : t.creneau_id;
        }

        setForm({
            titre: t.titre || '',
            marque_id: t.marque_id && typeof t.marque_id === 'object' ? t.marque_id._id : (t.marque_id || ''),
            intervenant_id: t.intervenant_id && typeof t.intervenant_id === 'object' ? t.intervenant_id._id : (t.intervenant_id || ''),
            creneau_id: targetCreneauId || '',
            statut: normalizeStatut(t.statut),
            date_tournage: t.date_tournage ? t.date_tournage.slice(0, 10) : '',
            lieu: t.lieu || '',
            type_contenu: t.type_contenu || 'presentation',
            plateforme: t.plateforme || 'Instagram',
            priorite: t.priorite || 'Moyenne',
            date_publication_prevue: t.date_publication_prevue ? t.date_publication_prevue.split('T')[0] : '',
            brief: t.brief || '',
            notes_internes: t.notes_internes || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteTournage = async () => {
        if (!editingId) return;
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tournage ? Cette action est irréversible.")) {
            try {
                await api.delete(`/tournages/${editingId}`);
                setIsModalOpen(false);
                resetTournageForm();
                await fetchData();
            } catch (err) {
                console.error('Erreur lors de la suppression', err);
                setErrorMessage(err.response?.data?.message || "Impossible de supprimer ce tournage.");
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleBookingInputChange = (e) => {
        const { name, value } = e.target;
        setBookingForm({ ...bookingForm, [name]: value });
    };

    const handleSaveTournage = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const payload = { 
            ...form, 
            statut: normalizeStatut(form.statut),
            marque_id: form.marque_id || null,
            intervenant_id: form.intervenant_id || null,
            creneau_id: form.creneau_id || null,
            date_publication_prevue: form.date_publication_prevue || null
        };

        try {
            if (editingId) {
                await api.put(`/tournages/${editingId}`, payload);
            } else {
                await api.post('/tournages', payload);
            }
            setIsModalOpen(false);
            resetTournageForm();
            await fetchData();
        } catch (err) {
            console.error('Erreur lors de la sauvegarde du tournage', err);
            setErrorMessage(err.response?.data?.message || err.message || "Impossible d'enregistrer le tournage.");
        }
    };

    const handleConfirmBooking = async () => {
        setBookingError('');
        try {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            
            const dateDebut = new Date(selectedDateObj);
            dateDebut.setHours(hours, minutes, 0, 0);
            
            const dateFin = new Date(dateDebut.getTime() + 30 * 60000);

            const res = await api.post('/creneaux', {
                intervenant_id: bookingForm.intervenant_id || null,
                date_debut: dateDebut.toISOString(),
                date_fin: dateFin.toISOString(),
                objet: bookingForm.objet || 'Créneau de tournage'
            });

            const createdId = res.data?._id || res.data?.creneau?._id || res.data?.data?._id;
            if (createdId) {
                setNewCreatedCreneauId(String(createdId));
            }

            setBookingStep(3);
            fetchData();
        } catch (err) {
            console.error('Erreur lors de la réservation', err);
            setBookingError(err.response?.data?.message || "Impossible de créer la réservation.");
        }
    };

    const handleCreateTournageFromBooking = () => {
        const savedCreneauId = newCreatedCreneauId;
        const savedIntervenantId = bookingForm.intervenant_id;
        const savedObjet = bookingForm.objet;

        setIsBookingOpen(false);
        setBookingStep(1);
        setSelectedTime('');

        setEditingId(null);
        setErrorMessage('');

        setForm({
            titre: savedObjet || '',
            marque_id: '',
            intervenant_id: savedIntervenantId || '',
            creneau_id: savedCreneauId || '',
            statut: 'A faire',
            date_tournage: '',
            lieu: '',
            type_contenu: 'presentation',
            plateforme: 'Instagram',
            priorite: 'Moyenne',
            date_publication_prevue: '',
            brief: '',
            notes_internes: ''
        });

        setIsModalOpen(true);
        setNewCreatedCreneauId(null);
        setBookingForm({ intervenant_id: '', objet: '' });
    };

    const resetTournageForm = () => {
        setEditingId(null);
        setErrorMessage('');
        setForm({
            titre: '', marque_id: '', intervenant_id: '', creneau_id: '', statut: 'A faire',
            date_tournage: '', lieu: '',
            type_contenu: 'presentation', plateforme: 'Instagram', priorite: 'Moyenne',
            date_publication_prevue: '', brief: '', notes_internes: ''
        });
    };

    const resetBookingForm = () => {
        setIsBookingOpen(false);
        setBookingStep(1);
        setBookingError('');
        setSelectedTime('');
        setCurrentWeekStart(getMonday(new Date()));
        setBookingForm({ intervenant_id: '', objet: '' });
    };

    const getEndTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + 30);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const selectedIntervenantData = intervenants.find(i => i._id === bookingForm.intervenant_id);

    // Formatage texte de la date sélectionnée pour l'étape 2 et 3
    const formattedSelectedDayStr = selectedDateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

    if (loading) return <div className="p-6 text-sm text-slate-500 font-medium">Chargement des données...</div>;

    return (
        <div className="p-6 md:p-8 bg-[#f8fafc] flex-1 w-full font-sans antialiased text-slate-900">

            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Tournages</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Gestion des contenus vidéo / photo</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => { 
                            setCurrentWeekStart(getMonday(new Date())); 
                            setSelectedDateObj(new Date());
                            setIsBookingOpen(true); 
                            setBookingStep(1); 
                        }}
                        className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-all"
                    >
                        <Calendar size={16} className="text-slate-400" />
                        <span>Réserver un créneau</span>
                    </button>
                    <button
                        onClick={() => { resetTournageForm(); setIsModalOpen(true); }}
                        className="flex-1 sm:flex-none justify-center bg-[#3e52b7] hover:bg-[#34449a] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 transition-all"
                    >
                        <Plus size={16} />
                        <span>Nouveau tournage</span>
                    </button>
                </div>
            </div>

            {/* TABLEAU DES TOURNAGES */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white">
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Titre</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Marque</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Intervenant</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Type</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Publication</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Statut</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Priorité</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {tournages.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                                            <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Video size={20} /></div>
                                            <p className="text-sm font-medium text-slate-700">Aucun tournage pour le moment</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tournages.map(t => {
                                    const canonicalStatut = normalizeStatut(t.statut);
                                    const statutInfo = STATUTS_CONFIG[canonicalStatut] || STATUTS_CONFIG['A faire'];

                                    return (
                                        <tr
                                            key={t._id}
                                            onClick={() => handleSelectTournage(t)}
                                            className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{t.titre}</td>
                                            <td className="px-6 py-4 text-sm text-slate-400 uppercase tracking-wide">{t.marque_id?.nom || '—'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-700 font-medium uppercase tracking-wide">
                                                {t.intervenant_id?.nom ? `${t.intervenant_id.nom} ${t.intervenant_id.prenom}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {t.type_contenu === 'presentation' ? 'Présentation / Démo'
                                                    : t.type_contenu === 'interview' ? 'Interview'
                                                    : t.type_contenu === 'vlog' ? 'Vlog'
                                                    : 'Autre'}
                                            </td>
                                            
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                {t.date_publication_prevue ? (
                                                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                        {new Date(`${t.date_publication_prevue.split('T')[0]}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">Non définie</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${statutInfo.style}`}>
                                                    {statutInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`font-medium ${
                                                    t.priorite?.toLowerCase() === 'haute' ? 'text-red-500'
                                                    : t.priorite?.toLowerCase() === 'basse' ? 'text-slate-400'
                                                    : 'text-amber-500'
                                                }`}>
                                                    {t.priorite || 'Moyenne'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALE 1 : FORMULAIRE TOURNAGE */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">

                        <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                    {editingId ? 'Modifier le projet' : 'Créer un nouveau tournage'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Renseignez les détails techniques et logistiques du contenu.</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTournage} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50 text-left flex-1">

                                {errorMessage && (
                                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                                        Erreur : {errorMessage}
                                    </div>
                                )}

                                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Titre du projet *</label>
                                        <input
                                            type="text" name="titre" value={form.titre} onChange={handleInputChange} required
                                            placeholder="Ex: Interview de lancement..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3e52b7] focus:ring-4 focus:ring-[#3e52b7]/10 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Marque *</label>
                                            <select name="marque_id" value={form.marque_id} onChange={handleInputChange} required className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3e52b7] cursor-pointer">
                                                <option value="">Sélectionner une marque</option>
                                                {marques.map(m => <option key={m._id} value={m._id}>{m.nom}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Intervenant principal</label>
                                            <select name="intervenant_id" value={form.intervenant_id} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3e52b7] cursor-pointer">
                                                <option value="">Aucun intervenant</option>
                                                {intervenants.map(i => <option key={i._id} value={i._id}>{i.nom} {i.prenom}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Créneau de tournage associé</label>
                                            <select
                                                name="creneau_id" value={form.creneau_id} onChange={handleInputChange}
                                                className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#3e52b7] transition-all cursor-pointer ${
                                                    form.creneau_id ? 'text-[#3e52b7] bg-indigo-50/20 border-indigo-200 font-bold' : 'text-slate-800 border-slate-200 font-medium'
                                                }`}
                                            >
                                                <option value="" className="text-slate-800 font-normal">Laisser libre (sans créneau)</option>
                                                {creneaux
                                                    .filter(c =>
                                                        !c.tournage_id ||
                                                        (editingId && String(c.tournage_id?._id || c.tournage_id) === String(editingId))
                                                    )
                                                    .map(c => (
                                                        <option key={c._id} value={c._id} className="text-slate-800 font-normal">
                                                            {formatCreneau(c) || 'Créneau'} — {c.objet || 'Studio'}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Statut de production</label>
                                            <select name="statut" value={form.statut} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#3e52b7] cursor-pointer">
                                                <option value="A faire">À faire</option>
                                                <option value="En cours">En cours</option>
                                                <option value="A valider">À valider</option>
                                                <option value="Valide">Validé</option>
                                                <option value="Publie">Publié</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Date de tournage
                                            </label>
                                            <input
                                                type="date"
                                                name="date_tournage"
                                                value={form.date_tournage}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3e52b7]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Lieu
                                            </label>
                                            <input
                                                type="text"
                                                name="lieu"
                                                value={form.lieu}
                                                onChange={handleInputChange}
                                                placeholder="Studio, Campus Paris, exterieur..."
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3e52b7]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Format de contenu</label>
                                            <select name="type_contenu" value={form.type_contenu} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3e52b7] cursor-pointer">
                                                <option value="interview">Interview face cam</option>
                                                <option value="presentation">Présentation / Démo</option>
                                                <option value="vlog">Vlog / Immersion</option>
                                                <option value="other">Autre format</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Niveau de Priorité</label>
                                            <select name="priorite" value={form.priorite} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#3e52b7] cursor-pointer">
                                                <option value="Basse">Basse</option>
                                                <option value="Moyenne">Moyenne</option>
                                                <option value="Haute">Haute</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Date de publication prévue</label>
                                        <input type="date" name="date_publication_prevue" value={form.date_publication_prevue} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3e52b7]" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Brief / Axe du Script</label>
                                        <textarea name="brief" value={form.brief} onChange={handleInputChange} rows="2" placeholder="Objectifs de la vidéo, grandes questions..." className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3e52b7] resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER MODALE */}
                            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center gap-3">
                                {editingId ? (
                                    <button
                                        type="button"
                                        onClick={handleDeleteTournage}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={15} />
                                        Supprimer
                                    </button>
                                ) : (
                                    <span />
                                )}
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50">
                                        Annuler
                                    </button>
                                    <button type="submit" className="bg-[#3e52b7] hover:bg-[#34449a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md">
                                        {editingId ? 'Enregistrer les modifications' : 'Valider et créer'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODALE 2 : RÉSERVER UN CRÉNEAU */}
            {isBookingOpen && (
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-xl rounded-xl shadow-lg flex flex-col overflow-hidden border border-slate-100">

                        <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-900">Réserver un créneau de tournage</h2>
                            <button onClick={resetBookingForm} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={18} /></button>
                        </div>

                        {bookingError && (
                            <div className="m-5 mb-0 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                                Erreur : {bookingError}
                            </div>
                        )}

                        {bookingStep === 1 && (
                            <div className="p-5 space-y-4 text-left">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Intervenant</label>
                                    <select name="intervenant_id" value={bookingForm.intervenant_id} onChange={handleBookingInputChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none font-medium">
                                        <option value="">Sélectionner un intervenant</option>
                                        {intervenants.map(i => <option key={i._id} value={i._id}>{i.nom} {i.prenom}</option>)}
                                    </select>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
                                    <button type="button" onClick={handlePreviousWeek} className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"><ChevronLeft size={14} /></button>
                                    <span className="text-xs font-bold text-slate-600">
                                        Semaine du {weekDays[0].fullDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <button type="button" onClick={handleNextWeek} className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"><ChevronRight size={14} /></button>
                                </div>

                                <div className="grid grid-cols-5 gap-2 text-center">
                                    {weekDays.map(d => {
                                        const isSelected = selectedDateObj.toDateString() === d.fullDate.toDateString();
                                        return (
                                            <button
                                                key={d.num + d.label} 
                                                type="button" 
                                                onClick={() => setSelectedDateObj(d.fullDate)}
                                                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                                                    isSelected ? 'bg-[#3e52b7] text-white font-medium border-[#3e52b7]' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                <p className="text-[10px] opacity-70 font-medium">{d.label}</p>
                                                <p className="text-sm font-bold mt-0.5">{d.num}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                {bookingForm.intervenant_id && (
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Créneaux disponibles</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot} type="button" onClick={() => setSelectedTime(slot)}
                                                    className={`py-1.5 px-2 rounded-lg text-center border text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                        selectedTime === slot ? 'bg-[#3e52b7] text-white border-[#3e52b7]' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    <Clock size={12} className="opacity-50" />
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedTime && (
                                            <button type="button" onClick={() => setBookingStep(2)} className="w-full bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium py-2 rounded-lg text-sm mt-2 cursor-pointer">
                                                Continuer
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {bookingStep === 2 && (
                            <div className="p-5 space-y-4 text-left">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        {selectedIntervenantData ? `${selectedIntervenantData.nom} ${selectedIntervenantData.prenom}` : 'Intervenant sélectionné'}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{formattedSelectedDayStr} · {selectedTime} — {getEndTime(selectedTime)}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Objet du tournage (optionnel)</label>
                                    <input type="text" name="objet" value={bookingForm.objet} onChange={handleBookingInputChange} placeholder="Ex: Interview étudiant..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7]" />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setBookingStep(1)} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-medium py-2 rounded-lg text-sm cursor-pointer">Retour</button>
                                    <button type="button" onClick={handleConfirmBooking} className="flex-1 bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium py-2 rounded-lg text-sm cursor-pointer">Confirmer la réservation</button>
                                </div>
                            </div>
                        )}

                        {bookingStep === 3 && (
                            <div className="p-6 text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-500"><CheckCircle2 size={32} /></div>
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-bold text-slate-900">Réservation créée !</h3>
                                    <p className="text-xs text-slate-500 font-medium">{formattedSelectedDayStr} · {selectedTime} — {getEndTime(selectedTime)}</p>
                                </div>
                                <div className="flex gap-3 pt-2 justify-center max-w-xs mx-auto">
                                    <button type="button" onClick={resetBookingForm} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-medium py-1.5 rounded-lg text-sm cursor-pointer">Fermer</button>
                                    <button type="button" onClick={handleCreateTournageFromBooking} className="flex-1 bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium py-1.5 rounded-lg text-sm cursor-pointer">Créer le tournage</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tournages;