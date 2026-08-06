import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import api from '../services/api';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

// Référentiel partagé avec les pages Tournages et Workflow
const normalizeStatut = (statutRaw) => {
    if (!statutRaw) return 'A faire';
    const s = String(statutRaw).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (s.includes('faire')) return 'A faire';
    if (s.includes('cours')) return 'En cours';
    if (s.includes('valider')) return 'A valider';
    if (s.includes('valide')) return 'Valide';
    if (s.includes('publi')) return 'Publie';
    return 'A faire';
};

const STATUTS_CONFIG = {
    'A faire': { label: 'À faire', color: 'text-slate-500' },
    'En cours': { label: 'En cours', color: 'text-blue-600' },
    'A valider': { label: 'À valider', color: 'text-amber-600' },
    'Valide': { label: 'Validé', color: 'text-teal-600' },
    'Publie': { label: 'Publié', color: 'text-emerald-600' }
};

// Accorde un mot au singulier ou au pluriel selon le nombre
const accorder = (n, singulier, pluriel) => (n === 1 ? singulier : pluriel);

// Joint une liste de textes en français : "a, b et c"
const listerTextes = (elements) => {
    if (elements.length === 0) return '';
    if (elements.length === 1) return elements[0];
    return `${elements.slice(0, -1).join(', ')} et ${elements[elements.length - 1]}`;
};

// Génère le paragraphe de synthèse en prose à partir des données du rapport
const genererSynthese = (reportData) => {
    const kpis = reportData?.kpis || {};
    const parStatut = reportData?.repartition?.parStatut || {};
    const parMarque = reportData?.repartition?.parMarque || {};
    const creneaux = reportData?.creneaux || [];

    const totalTournages = kpis.totalTournages || 0;
    const totalCreneaux = kpis.totalCreneaux || 0;
    const totalContenusPublies = kpis.totalContenusPublies || 0;

    const phrases = [];

    // Tournages
    if (totalTournages === 0) {
        phrases.push("Aucun tournage n'a été programmé sur cette période.");
    } else {
        const nomsMarques = Object.keys(parMarque).filter(n => n !== 'Sans marque');
        phrases.push(
            `${totalTournages} ${accorder(totalTournages, 'tournage a été programmé', 'tournages ont été programmés')}` +
            (nomsMarques.length ? ` pour ${listerTextes(nomsMarques)}` : '') + '.'
        );

        const clauseTournage = (n, singulier, pluriel) =>
            `${n} ${accorder(n, 'tournage', 'tournages')} ${accorder(n, singulier, pluriel)}`;

        const clauses = [];
        if (parStatut['A faire']) clauses.push(clauseTournage(parStatut['A faire'], 'reste à tourner', 'restent à tourner'));
        if (parStatut['En cours']) clauses.push(clauseTournage(parStatut['En cours'], 'est en cours de tournage', 'sont en cours de tournage'));
        if (parStatut['A valider']) clauses.push(clauseTournage(parStatut['A valider'], 'est en attente de validation', 'sont en attente de validation'));
        if (parStatut['Valide']) clauses.push(clauseTournage(parStatut['Valide'], 'est validé et prêt à être publié', 'sont validés et prêts à être publiés'));
        if (parStatut['Publie']) clauses.push(clauseTournage(parStatut['Publie'], 'a déjà été publié', 'ont déjà été publiés'));

        if (clauses.length > 0) {
            phrases.push(`Parmi eux, ${listerTextes(clauses)}.`);
        }
    }

    // Créneaux
    if (totalCreneaux === 0) {
        phrases.push("Aucun créneau n'a été réservé sur cette période.");
    } else {
        const intervenantsUniques = [...new Set(
            creneaux
                .map(c => c.intervenant_id ? `${c.intervenant_id.prenom || ''} ${c.intervenant_id.nom || ''}`.trim() : null)
                .filter(Boolean)
        )];
        phrases.push(
            `${totalCreneaux} ${accorder(totalCreneaux, 'créneau a été réservé', 'créneaux ont été réservés')}` +
            (intervenantsUniques.length ? ` avec ${listerTextes(intervenantsUniques)}` : '') + '.'
        );
    }

    // Contenus publiés
    if (totalContenusPublies === 0) {
        phrases.push("Aucun contenu n'a été publié sur cette période.");
    } else {
        phrases.push(`${totalContenusPublies} ${accorder(totalContenusPublies, 'contenu a été publié', 'contenus ont été publiés')} sur les réseaux.`);
    }

    return phrases.join(' ');
};

const Rapport = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    const reportRef = useRef(null);

    const getWeekRange = (date) => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);

        const monday = new Date(date);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { startDate: monday, endDate: sunday };
    };

    const { startDate, endDate } = getWeekRange(currentDate);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = startDate.toISOString();
            const endStr = endDate.toISOString();

            const res = await api.get(`/rapports?startDate=${startStr}&endDate=${endStr}`);
            setReportData(res.data);
        } catch (err) {
            console.error("Erreur lors de la récupération du rapport :", err);
            setError("Impossible de charger les données du rapport. Vérifie que le serveur backend est bien lancé.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    const handlePreviousWeek = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 7);
        setCurrentDate(prev);
    };

    const handleNextWeek = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 7);
        setCurrentDate(next);
    };

    const formatDateFr = (date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const formatDateCourte = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const formatHeure = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const handleExportPDF = () => {
        const element = reportRef.current;
        if (!element) return;

        setExporting(true);

        const options = {
            margin: [10, 10, 10, 10],
            filename: `Rapport_Hebdomadaire_${startDate.toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save()
            .catch((err) => {
                console.error("Erreur lors de l'export PDF :", err);
                alert("Impossible de générer le PDF.");
            })
            .finally(() => setExporting(false));
    };

    // Met en évidence les chiffres du paragraphe de synthèse dans la couleur de la marque
    const surlignerChiffres = (texte) => {
        const parts = texte.split(/(\d+)/g);
        return parts.map((part, i) =>
            /^\d+$/.test(part)
                ? <strong key={i} className="text-[#3e52b7]">{part}</strong>
                : <React.Fragment key={i}>{part}</React.Fragment>
        );
    };

    const tournages = reportData?.tournages || [];
    const creneaux = reportData?.creneaux || [];
    const synthese = reportData ? genererSynthese(reportData) : '';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Barre de contrôle supérieure */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Rapport Hebdomadaire</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Synthèse globale des activités de l'application</p>
                </div>
                <button
                    onClick={handleExportPDF}
                    disabled={loading || !!error || !reportData || exporting}
                    className="bg-[#3e52b7] hover:bg-[#34449a] text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} />
                    {exporting ? 'Génération du PDF...' : 'Télécharger en PDF'}
                </button>
            </div>

            {/* Navigation de semaine */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <button
                    onClick={handlePreviousWeek}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm transition font-medium flex items-center gap-1"
                >
                    <ChevronLeft size={14} /> Semaine précédente
                </button>
                <span className="font-semibold text-slate-700 text-sm">
                    Semaine du {formatDateFr(startDate)} au {formatDateFr(endDate)}
                </span>
                <button
                    onClick={handleNextWeek}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm transition font-medium flex items-center gap-1"
                >
                    Semaine suivante <ChevronRight size={14} />
                </button>
            </div>

            {/* Zone de contenu / Rapport PDF */}
            {loading ? (
                <div className="text-center py-12 text-slate-500 font-medium">Génération du rapport en cours...</div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium text-sm border border-red-100">{error}</div>
            ) : (
                <div ref={reportRef} className="space-y-8 bg-white p-10 border border-slate-100 shadow-sm font-serif text-slate-800">

                    {/* En-tête façon lettre / document officiel */}
                    <table className="w-full border-b-2 border-[#3e52b7] pb-3 mb-2">
                        <tbody>
                            <tr>
                                <td className="align-bottom">
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rapport hebdomadaire</h2>
                                    <p className="text-sm text-[#3e52b7] mt-1 italic font-medium">
                                        Période du {formatDateFr(startDate)} au {formatDateFr(endDate)}
                                    </p>
                                </td>
                                <td className="text-right align-bottom">
                                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Document officiel</span>
                                    <span className="text-sm font-semibold text-[#3e52b7]">Manager Hub</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* I. Synthèse */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b-2 border-[#3e52b7]/20 pb-1">
                            <span className="text-[#3e52b7]">I.</span> Synthèse de la semaine
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {synthese ? surlignerChiffres(synthese) : "Aucune donnée disponible pour cette période."}
                        </p>
                    </div>

                    {/* II. Tableau des tournages */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b-2 border-[#3e52b7]/20 pb-1">
                            <span className="text-[#3e52b7]">II.</span> Tournages de la semaine
                        </h3>

                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="text-[#3e52b7] text-xs uppercase tracking-wider border-b-2 border-[#3e52b7]/30">
                                    <th className="py-2 pr-3 font-semibold">Titre / Projet</th>
                                    <th className="py-2 pr-3 font-semibold">Marque</th>
                                    <th className="py-2 pr-3 font-semibold">Intervenant</th>
                                    <th className="py-2 pr-3 font-semibold">Statut</th>
                                    <th className="py-2 pl-3 font-semibold text-right">Date du tournage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tournages.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-5 text-center text-slate-400 italic">
                                            Aucun tournage prévu pour cette période.
                                        </td>
                                    </tr>
                                ) : (
                                    tournages.map((t) => {
                                        const canonicalStatut = normalizeStatut(t.statut);
                                        const statutInfo = STATUTS_CONFIG[canonicalStatut] || STATUTS_CONFIG['A faire'];

                                        return (
                                            <tr key={t._id}>
                                                <td className="py-2.5 pr-3 font-semibold text-slate-900">{t.titre || 'Sans titre'}</td>
                                                <td className="py-2.5 pr-3 text-slate-600">{t.marque_id?.nom || 'N/C'}</td>
                                                <td className="py-2.5 pr-3 text-slate-600">
                                                    {t.intervenant_id ? `${t.intervenant_id.prenom || ''} ${t.intervenant_id.nom || ''}`.trim() : 'N/C'}
                                                </td>
                                                <td className={`py-2.5 pr-3 font-semibold ${statutInfo.color}`}>
                                                    {statutInfo.label}
                                                </td>
                                                <td className="py-2.5 pl-3 text-right text-slate-500">
                                                    {new Date(t.date_effective).toLocaleDateString('fr-FR')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* III. Tableau des créneaux */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b-2 border-[#3e52b7]/20 pb-1">
                            <span className="text-[#3e52b7]">III.</span> Créneaux réservés sur la semaine
                        </h3>

                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="text-[#3e52b7] text-xs uppercase tracking-wider border-b-2 border-[#3e52b7]/30">
                                    <th className="py-2 pr-3 font-semibold">Intervenant</th>
                                    <th className="py-2 pr-3 font-semibold">Objet</th>
                                    <th className="py-2 pr-3 font-semibold">Tournage lié</th>
                                    <th className="py-2 pl-3 font-semibold text-right">Date</th>
                                    <th className="py-2 pl-3 font-semibold text-right">Horaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {creneaux.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-5 text-center text-slate-400 italic">
                                            Aucun créneau réservé pour cette période.
                                        </td>
                                    </tr>
                                ) : (
                                    creneaux.map((c) => (
                                        <tr key={c._id}>
                                            <td className="py-2.5 pr-3 font-semibold text-slate-900">
                                                {c.intervenant_id ? `${c.intervenant_id.prenom || ''} ${c.intervenant_id.nom || ''}`.trim() : 'N/C'}
                                            </td>
                                            <td className="py-2.5 pr-3 text-slate-600">{c.objet || 'Créneau de tournage'}</td>
                                            <td className="py-2.5 pr-3 text-slate-600">{c.tournage_id?.titre || '—'}</td>
                                            <td className="py-2.5 pl-3 text-right text-slate-500">
                                                {formatDateCourte(c.date_debut)}
                                            </td>
                                            <td className="py-2.5 pl-3 text-right text-slate-500">
                                                {formatHeure(c.date_debut)} – {formatHeure(c.date_fin)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pied de page */}
                    <table className="w-full pt-4 mt-4 border-t border-slate-200 text-xs text-slate-400">
                        <tbody>
                            <tr>
                                <td className="text-left">Généré automatiquement par l'application</td>
                                <td className="text-right">Date d'exportation : {new Date().toLocaleDateString('fr-FR')}</td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            )}
        </div>
    );
};

export default Rapport;
