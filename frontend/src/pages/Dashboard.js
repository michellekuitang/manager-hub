import { useState, useEffect } from 'react';
import {
    FileText,
    AlertTriangle,
    Megaphone,
    Target,
    CalendarClock,
    CheckCircle2,
    Clapperboard
} from 'lucide-react';
import api from '../services/api';

// Référentiel de statuts partagé avec Tournages / Workflow / Rapport
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

const STATUTS_ORDRE = ['A faire', 'En cours', 'A valider', 'Valide', 'Publie'];

const STATUTS_CONFIG = {
    'A faire': { label: 'À faire', badge: 'bg-slate-50 text-slate-600 border-slate-200', barre: '#94a3b8' },
    'En cours': { label: 'En cours', badge: 'bg-blue-50 text-blue-700 border-blue-200', barre: '#3e52b7' },
    'A valider': { label: 'À valider', badge: 'bg-amber-50 text-amber-700 border-amber-200', barre: '#f59e0b' },
    'Valide': { label: 'Validé', badge: 'bg-teal-50 text-teal-700 border-teal-200', barre: '#14b8a6' },
    'Publie': { label: 'Publié', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', barre: '#10b981' }
};

const PILIER_LABELS = {
    Acquisition: 'Acquisition',
    Engagement: 'Engagement',
    Fidelisation: 'Fidélisation',
    Notoriete: 'Notoriété'
};

const PILIER_COLORS = ['#3e52b7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
    const [contenus, setContenus] = useState([]);
    const [campagnes, setCampagnes] = useState([]);
    const [marques, setMarques] = useState([]);
    const [tournages, setTournages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [animateCharts, setAnimateCharts] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [resContenus, resCampagnes, resMarques, resTournages] = await Promise.all([
                    api.get('/contenus'),
                    api.get('/campagnes'),
                    api.get('/marques'),
                    api.get('/tournages')
                ]);

                setContenus(resContenus.data);
                setCampagnes(resCampagnes.data);
                setMarques(resMarques.data);
                setTournages(Array.isArray(resTournages.data) ? resTournages.data : []);

                setTimeout(() => setAnimateCharts(true), 100);
            } catch (err) {
                console.error("Erreur lors de la récupération des données du dashboard :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleApprouverContenu = async (id) => {
        try {
            await api.patch(`/contenus/${id}/statut`, { statut_workflow: 'Validé' });
            setContenus(prev => prev.map(c =>
                c._id === id ? { ...c, statut_workflow: 'Validé' } : c
            ));
        } catch (err) {
            console.error("Erreur lors de la validation rapide :", err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3e52b7]"></div>
            </div>
        );
    }

    // ==========================================
    // CALCULS DES METRIQUES (statuts normalisés pour éviter les soucis d'accents)
    // ==========================================

    const totalContenus = contenus.length;
    const publiesCount = contenus.filter(c => normalizeStatut(c.statut_workflow) === 'Publie').length;

    const aValiderContenus = contenus.filter(c => normalizeStatut(c.statut_workflow) === 'A valider');
    const aValiderCount = aValiderContenus.length;

    const campagnesActives = campagnes.filter(c => c.statut === 'Active');
    const campagnesActivesCount = campagnesActives.length;
    const totalCampagnesCount = campagnes.length;

    const totalDepenseActives = campagnesActives.reduce((sum, c) => sum + (c.depense || 0), 0);
    const totalLeadsActives = campagnesActives.reduce((sum, c) => sum + (c.leads || 0), 0);
    const coutParLead = totalLeadsActives > 0
        ? (totalDepenseActives / totalLeadsActives).toFixed(2)
        : "0.00";

    const getBrandName = (c) => {
        if (c.tournage_id && typeof c.tournage_id === 'object' && c.tournage_id.marque_id) {
            return c.tournage_id.marque_id.nom || 'Sans marque';
        }
        if (c.marque_id && typeof c.marque_id === 'object') {
            return c.marque_id.nom;
        }
        return 'Sans marque';
    };

    // Tournages programmés dans les 7 prochains jours (basé sur date_tournage)
    const maintenant = new Date();
    const dansSeptJours = new Date();
    dansSeptJours.setDate(dansSeptJours.getDate() + 7);

    const tournagesAVenir = tournages
        .filter(t => {
            if (!t.date_tournage) return false;
            const d = new Date(t.date_tournage);
            return d >= maintenant && d <= dansSeptJours;
        })
        .sort((a, b) => new Date(a.date_tournage) - new Date(b.date_tournage))
        .slice(0, 5);

    const formatDateCourte = (date) => new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

    // ==========================================
    // GRAPHIQUES (SVG natifs)
    // ==========================================

    const pipelineCounts = STATUTS_ORDRE.map(key => ({
        key,
        label: STATUTS_CONFIG[key].label,
        couleur: STATUTS_CONFIG[key].barre,
        count: contenus.filter(c => normalizeStatut(c.statut_workflow) === key).length
    }));

    const maxPipelineValue = Math.max(...pipelineCounts.map(d => d.count), 4);

    const pilierCounts = contenus.reduce((acc, c) => {
        const pilier = c.pilier || 'Non défini';
        acc[pilier] = (acc[pilier] || 0) + 1;
        return acc;
    }, {});

    const totalPiliersCount = Object.values(pilierCounts).reduce((a, b) => a + b, 0);

    let accumulatedPercent = 0;
    const donutSlices = Object.entries(pilierCounts).map(([name, count], index) => {
        const percent = totalPiliersCount > 0 ? (count / totalPiliersCount) * 100 : 0;
        const strokeDashArray = `${percent} ${100 - percent}`;
        const strokeDashOffset = 100 - accumulatedPercent;
        accumulatedPercent += percent;

        return {
            name: PILIER_LABELS[name] || name,
            count,
            percent,
            strokeDashArray,
            strokeDashOffset,
            color: PILIER_COLORS[index % PILIER_COLORS.length]
        };
    });

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

            {/* EN-TÊTE */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Vue d'ensemble de vos <span className="font-semibold text-[#3e52b7]">{marques.length}</span> marques
                </p>
            </div>

            {/* CARTES KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contenus</p>
                            <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalContenus}</p>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 font-medium">
                        <span className="font-bold text-slate-700">{publiesCount}</span> publiés
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">À valider</p>
                            <p className="text-3xl font-extrabold text-slate-900 mt-2">{aValiderCount}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${aValiderCount > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                            <AlertTriangle size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 font-medium">
                        {aValiderCount > 0 ? <span className="text-amber-600 font-semibold">En attente de validation</span> : "En attente"}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campagnes actives</p>
                            <p className="text-3xl font-extrabold text-slate-900 mt-2">{campagnesActivesCount}</p>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl">
                            <Megaphone size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 font-medium">
                        <span className="font-bold text-slate-700">{totalCampagnesCount}</span> au total
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coût / Lead</p>
                            <p className="text-3xl font-extrabold text-slate-900 mt-2">{coutParLead}€</p>
                        </div>
                        <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl">
                            <Target size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 font-medium">
                        <span className="font-bold text-slate-700">{totalLeadsActives}</span> leads générés
                    </p>
                </div>

            </div>

            {/* SECTIONS ACTIONNABLES : ce qui demande une action, avant les graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Contenus à valider */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-7">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                            <AlertTriangle size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">Contenus à valider</h3>
                    </div>

                    {aValiderCount === 0 ? (
                        <div className="bg-slate-50/50 rounded-xl py-12 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200">
                            Aucun contenu en attente de validation 🎉
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3 px-4">Titre</th>
                                        <th className="py-3 px-4">Marque</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm">
                                    {aValiderContenus.map(c => (
                                        <tr key={c._id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-slate-900 truncate max-w-[220px]">
                                                {c.titre}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-[#3e52b7]">
                                                {getBrandName(c)}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                    {c.type_contenu || 'Format libre'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => handleApprouverContenu(c._id)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 font-bold text-xs rounded-full transition-all active:scale-95 shadow-sm"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Approuver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Tournages à venir */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-5">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                            <CalendarClock size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">Tournages à venir (7 jours)</h3>
                    </div>

                    {tournagesAVenir.length === 0 ? (
                        <div className="bg-slate-50/50 rounded-xl py-12 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200">
                            Aucun tournage programmé cette semaine.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {tournagesAVenir.map(t => {
                                const statutInfo = STATUTS_CONFIG[normalizeStatut(t.statut)];
                                return (
                                    <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                                            <Clapperboard size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{t.titre}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {t.marque_id?.nom || 'Sans marque'}
                                                {t.intervenant_id ? ` · ${t.intervenant_id.nom} ${t.intervenant_id.prenom}` : ''}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-semibold text-slate-700 capitalize">{formatDateCourte(t.date_tournage)}</p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${statutInfo.badge}`}>
                                                {statutInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* GRAPHIQUES (SVG natifs) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Pipeline Contenu (Bar Chart) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm lg:col-span-7">
                    <h3 className="text-sm font-bold text-slate-800 mb-6">Pipeline contenu</h3>

                    <div className="relative w-full h-[240px]">
                        <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                const yPos = 190 - ratio * 150;
                                const labelValue = Math.round(maxPipelineValue * ratio);
                                return (
                                    <g key={i} className="opacity-40">
                                        <line x1="45" y1={yPos} x2="480" y2={yPos} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                                        <text x="15" y={yPos + 4} fill="#9ca3af" className="text-[10px] font-semibold font-mono">{labelValue}</text>
                                    </g>
                                );
                            })}

                            {pipelineCounts.map((d, index) => {
                                const barWidth = 36;
                                const xGap = (430 / pipelineCounts.length);
                                const xPos = 60 + index * xGap + (xGap - barWidth) / 2;

                                const targetHeight = d.count > 0 ? (d.count / maxPipelineValue) * 150 : 4;
                                const barHeight = animateCharts ? targetHeight : 0;
                                const yPos = 190 - barHeight;

                                return (
                                    <g key={d.key} className="group cursor-pointer">
                                        <title>{`${d.label} : ${d.count} contenus`}</title>
                                        <rect
                                            x={xPos}
                                            y={yPos}
                                            width={barWidth}
                                            height={barHeight}
                                            rx="6"
                                            fill={d.couleur}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        {d.count > 0 && animateCharts && (
                                            <text
                                                x={xPos + barWidth / 2}
                                                y={yPos - 6}
                                                textAnchor="middle"
                                                fill="#111827"
                                                className="text-[11px] font-bold transition-opacity duration-500 delay-500"
                                            >
                                                {d.count}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            <line x1="45" y1="190" x2="480" y2="190" stroke="#d1d5db" strokeWidth="1" />
                        </svg>

                        <div className="absolute left-[45px] right-[20px] bottom-1 flex justify-between text-[11px] font-bold text-slate-500 px-2">
                            {pipelineCounts.map(d => (
                                <span key={d.key} className="w-[70px] text-center truncate">
                                    {d.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Répartition par pilier (Donut Chart) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm lg:col-span-5 flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Répartition par pilier</h3>

                    {totalPiliersCount === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic py-12">
                            Aucune donnée de pilier disponible
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                            <div className="relative w-36 h-36">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5.5" />
                                    {donutSlices.map((slice, i) => (
                                        <circle
                                            key={i}
                                            cx="21"
                                            cy="21"
                                            r="15.915"
                                            fill="transparent"
                                            stroke={slice.color}
                                            strokeWidth="5.8"
                                            strokeDasharray={animateCharts ? slice.strokeDashArray : "0 100"}
                                            strokeDashoffset={animateCharts ? slice.strokeDashOffset : 100}
                                            className="transition-all duration-1000 ease-in-out"
                                        />
                                    ))}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-800">{totalContenus}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                                </div>
                            </div>

                            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                                {donutSlices.map((slice, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                                            {slice.name}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            ({slice.count})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
};

export default Dashboard;
