import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Plus, X, ChevronLeft, ChevronRight, CheckCircle2, Clock, Video, ChevronRight as ArrowRight } from 'lucide-react';

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
        statut: 'A tourner',
        type_contenu: 'presentation',
        plateforme: 'Instagram',
        priorite: 'Moyenne',
        date_publication_prevue: '',
        brief: '',
        notes_internes: ''
    });

    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);
    const [selectedDay, setSelectedDay] = useState('JEU. 16');
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

    const weekDays = [
        { label: 'LUN.', num: '13' },
        { label: 'MAR.', num: '14' },
        { label: 'MER.', num: '15' },
        { label: 'JEU.', num: '16' },
        { label: 'VEN.', num: '17' }
    ];

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

    // CORRECTION 2 : formatCreneau simplifié, reçoit directement l'objet peuplé
    const formatCreneau = (creneauData) => {
        if (!creneauData) return '—';

        // Si c'est un string (ID brut), on cherche dans le state local
        if (typeof creneauData === 'string') {
            const found = creneaux.find(c => String(c._id) === String(creneauData));
            if (!found) return '—';
            creneauData = found;
        }

        // Si c'est un tableau, on prend le premier élément
        if (Array.isArray(creneauData)) {
            creneauData = creneauData[0];
        }

        if (!creneauData || !creneauData.date_debut) return '—';

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
            statut: t.statut || 'A tourner',
            type_contenu: t.type_contenu || 'presentation',
            plateforme: t.plateforme || 'Instagram',
            priorite: t.priorite || 'Moyenne',
            date_publication_prevue: t.date_publication_prevue ? t.date_publication_prevue.split('T')[0] : '',
            brief: t.brief || '',
            notes_internes: t.notes_internes || ''
        });
        setIsModalOpen(true);
    };

    const handleAvancerStatut = async (id, currentStatut) => {
        const etapes = ['A tourner', 'Tourne', 'Monte', 'Publie'];
        const currentIndex = etapes.indexOf(currentStatut);
        if (currentIndex !== -1 && currentIndex < etapes.length - 1) {
            const nextStatut = etapes[currentIndex + 1];
            try {
                await api.put(`/tournages/${id}`, { statut: nextStatut });
                fetchData();
            } catch (err) {
                console.error("Erreur lors de l'avancement du statut", err);
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

        const selectedSlot = form.creneau_id || null;
        const payload = {
            ...form,
            creneau_id: selectedSlot
        };

        if (payload.intervenant_id === '') payload.intervenant_id = null;

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
        try {
            const dayNum = selectedDay.split(' ')[1];
            const [hours, minutes] = selectedTime.split(':');
            const dateDebut = new Date(2026, 6, parseInt(dayNum), parseInt(hours), parseInt(minutes));
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
        }
    };

    // CORRECTION 1 : ordre des opérations corrigé pour ne pas perdre savedCreneauId
    const handleCreateTournageFromBooking = () => {
        // Sauvegarde TOUT avant tout reset
        const savedCreneauId = newCreatedCreneauId;
        const savedIntervenantId = bookingForm.intervenant_id;
        const savedObjet = bookingForm.objet;

        // Ferme la modale booking SANS reset complet
        setIsBookingOpen(false);
        setBookingStep(1);
        setSelectedTime('');
        // Ne pas reset newCreatedCreneauId ici

        setEditingId(null);
        setErrorMessage('');

        setForm({
            titre: savedObjet || '',
            marque_id: '',
            intervenant_id: savedIntervenantId || '',
            creneau_id: savedCreneauId || '',
            statut: 'A tourner',
            type_contenu: 'presentation',
            plateforme: 'Instagram',
            priorite: 'Moyenne',
            date_publication_prevue: '',
            brief: '',
            notes_internes: ''
        });

        setIsModalOpen(true);

        // Reset uniquement à la fin
        setNewCreatedCreneauId(null);
        setBookingForm({ intervenant_id: '', objet: '' });
    };

    const resetTournageForm = () => {
        setEditingId(null);
        setErrorMessage('');
        setForm({
            titre: '', marque_id: '', intervenant_id: '', creneau_id: '', statut: 'A tourner',
            type_contenu: 'presentation', plateforme: 'Instagram', priorite: 'Moyenne',
            date_publication_prevue: '', brief: '', notes_internes: ''
        });
    };

    const resetBookingForm = () => {
        setIsBookingOpen(false);
        setBookingStep(1);
        setSelectedTime('');
        setBookingForm({ intervenant_id: '', objet: '' });
    };

    const getEndTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + 30);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const stats = tournages.reduce((acc, t) => {
        if (t.statut === 'A tourner') acc.aTourner++;
        if (t.statut === 'Tourne') acc.tourne++;
        if (t.statut === 'Monte') acc.monte++;
        if (t.statut === 'Publie') acc.publie++;
        return acc;
    }, { aTourner: 0, tourne: 0, monte: 0, publie: 0 });

    const selectedIntervenantData = intervenants.find(i => i._id === bookingForm.intervenant_id);

    if (loading) return <div className="p-6 text-sm text-slate-500 font-medium">Chargement des données...</div>;

    return (
        <div className="p-6 md:p-8 bg-[#f8fafc] h-screen overflow-y-auto flex-1 w-full relative font-sans antialiased text-slate-900">

            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Tournages</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Gestion des contenus vidéo / photo</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => { setIsBookingOpen(true); setBookingStep(1); }}
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

            {/* STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#f1f5f9]/60 border border-slate-200 rounded-xl p-5 text-left">
                    <p className="text-2xl font-bold text-slate-800">{stats.aTourner}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">À tourner</p>
                </div>
                <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-5 text-left">
                    <p className="text-2xl font-bold text-blue-600">{stats.tourne}</p>
                    <p className="text-xs text-blue-500 mt-1 font-medium">Tourné</p>
                </div>
                <div className="bg-[#fffbeb] border border-amber-100 rounded-xl p-5 text-left">
                    <p className="text-2xl font-bold text-amber-600">{stats.monte}</p>
                    <p className="text-xs text-amber-600 mt-1 font-medium">Monté</p>
                </div>
                <div className="bg-[#f0fdf4] border border-emerald-100 rounded-xl p-5 text-left">
                    <p className="text-2xl font-bold text-emerald-600">{stats.publie}</p>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Publié</p>
                </div>
            </div>

            {/* TABLEAU */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white">
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Titre</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Marque</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Intervenant</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Type</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Créneau</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Statut</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400">Priorité</th>
                                <th className="px-6 py-3.5 text-sm font-normal text-slate-400 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {tournages.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                                            <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Video size={20} /></div>
                                            <p className="text-sm font-medium text-slate-700">Aucun tournage pour le moment</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tournages.map(t => (
                                    <tr
                                        key={t._id}
                                        onClick={() => handleSelectTournage(t)}
                                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{t.titre}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400 uppercase tracking-wide">{t.marque_id?.nom || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700 font-medium uppercase tracking-wide">
                                            {t.intervenant_id ? `${t.intervenant_id.nom} ${t.intervenant_id.prenom}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {t.type_contenu === 'presentation' ? 'Présentation / Démo' : t.type_contenu === 'interview' ? 'Interview' : t.type_contenu === 'vlog' ? 'Vlog' : 'Autre'}
                                        </td>
                                        {/* CORRECTION 2 : on passe directement t.creneau_id (déjà peuplé par le backend) */}
                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                            {formatCreneau(t.creneau_id)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${
                                                t.statut === 'Publie' ? 'bg-[#f0fdf4] text-emerald-600 border-emerald-200' :
                                                t.statut === 'Monte' ? 'bg-[#fffbeb] text-amber-600 border-amber-200' :
                                                t.statut === 'Tourne' ? 'bg-[#eff6ff] text-blue-600 border-blue-200' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                                {t.statut === 'A tourner' ? 'À tourner' : t.statut === 'Tourne' ? 'Tourné' : t.statut === 'Monte' ? 'Monté' : 'Publié'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`font-medium ${
                                                t.priorite?.toLowerCase() === 'haute' ? 'text-red-500' : t.priorite?.toLowerCase() === 'basse' ? 'text-slate-400' : 'text-amber-500'
                                            }`}>
                                                {t.priorite || 'Moyenne'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            {t.statut !== 'Publie' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAvancerStatut(t._id, t.statut); }}
                                                    className="inline-flex items-center gap-1 text-slate-900 font-medium hover:text-slate-600 transition-colors"
                                                >
                                                    <span>Avancer</span>
                                                    <ArrowRight size={14} className="mt-0.5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
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
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl"><X size={18} /></button>
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
                                                {/* CORRECTION 3 : on filtre les créneaux déjà pris par d'autres tournages */}
                                                {creneaux
                                                    .filter(c =>
                                                        !c.tournage_id ||
                                                        (editingId && String(c.tournage_id) === String(editingId))
                                                    )
                                                    .map(c => (
                                                        <option key={c._id} value={c._id} className="text-slate-800 font-normal">
                                                            {formatCreneau(c)} — {c.objet || 'Studio'}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Statut de production</label>
                                            <select name="statut" value={form.statut} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#3e52b7] cursor-pointer">
                                                <option value="A tourner">A tourner</option>
                                                <option value="Tourne">Tourné</option>
                                                <option value="Monte">Monté</option>
                                                <option value="Publie">Publié</option>
                                            </select>
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

                            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50">Annuler</button>
                                <button type="submit" className="bg-[#3e52b7] hover:bg-[#34449a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md">
                                    {editingId ? 'Enregistrer les modifications' : 'Valider et créer'}
                                </button>
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
                                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><ChevronLeft size={14} /></button>
                                    <span className="text-xs font-bold text-slate-600">13 juil. — 17 juil. 2026</span>
                                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><ChevronRight size={14} /></button>
                                </div>

                                <div className="grid grid-cols-5 gap-2 text-center">
                                    {weekDays.map(d => (
                                        <button
                                            key={d.num} type="button" onClick={() => setSelectedDay(`${d.label} ${d.num}`)}
                                            className={`p-2 rounded-lg border text-center transition-all ${
                                                selectedDay === `${d.label} ${d.num}` ? 'bg-[#3e52b7] text-white font-medium border-[#3e52b7]' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            <p className="text-[10px] opacity-70 font-medium">{d.label}</p>
                                            <p className="text-sm font-bold mt-0.5">{d.num}</p>
                                        </button>
                                    ))}
                                </div>

                                {bookingForm.intervenant_id && (
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Créneaux disponibles</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot} type="button" onClick={() => setSelectedTime(slot)}
                                                    className={`py-1.5 px-2 rounded-lg text-center border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                                                        selectedTime === slot ? 'bg-[#3e52b7] text-white border-[#3e52b7]' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    <Clock size={12} className="opacity-50" />
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>

                                        {selectedTime && (
                                            <button type="button" onClick={() => setBookingStep(2)} className="w-full bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium py-2 rounded-lg text-sm mt-2">
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
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedDay} 2026 · {selectedTime} — {getEndTime(selectedTime)}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Objet du tournage (optionnel)</label>
                                    <input type="text" name="objet" value={bookingForm.objet} onChange={handleBookingInputChange} placeholder="Ex: Interview étudiant MBA..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3e52b7]" />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setBookingStep(1)} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-medium py-2 rounded-lg text-sm">Retour</button>
                                    <button type="button" onClick={handleConfirmBooking} className="flex-1 bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium py-2 rounded-lg text-sm">Confirmer la réservation</button>
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
                                    <p className="text-xs text-slate-500 font-medium">{selectedDay} · {selectedTime} — {getEndTime(selectedTime)}</p>
                                </div>

                                <div className="flex gap-3 pt-2 justify-center max-w-xs mx-auto">
                                    <button type="button" onClick={resetBookingForm} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-medium py-1.5 rounded-lg text-sm">Fermer</button>
                                    <button type="button" onClick={handleCreateTournageFromBooking} className="flex-1 bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium py-1.5 rounded-lg text-sm">Créer le tournage</button>
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