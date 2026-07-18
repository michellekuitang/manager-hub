import { useState, useEffect } from 'react';
import api from '../services/api';

// Configuration des couleurs pour les piliers du graphique en donut
const PILIER_COLORS = [
    '#3b49df', // Bleu indigo principal
    '#10b981', // Émeraude
    '#f59e0b', // Ambre / Orange
    '#8b5cf6', // Violet
    '#ec4899', // Rose
];

const Dashboard = () => {
    const [contenus, setContenus] = useState([]);
    const [campagnes, setCampagnes] = useState([]);
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);

    // État pour gérer une animation fluide à l'ouverture du dashboard
    const [animateCharts, setAnimateCharts] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Récupération des contenus, campagnes et marques en parallèle
                const [resContenus, resCampagnes, resMarques] = await Promise.all([
                    api.get('/contenus'),
                    api.get('/campagnes'),
                    api.get('/marques')
                ]);

                setContenus(resContenus.data);
                setCampagnes(resCampagnes.data);
                setMarques(resMarques.data);
                
                // Déclenche l'animation des graphiques juste après le chargement
                setTimeout(() => setAnimateCharts(true), 100);
            } catch (err) {
                console.error("Erreur lors de la récupération des données du dashboard :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Action rapide : Approuver directement un contenu depuis le Dashboard
    const handleApprouverContenu = async (id) => {
        try {
            await api.patch(`/contenus/${id}/statut`, { statut_workflow: 'Valide' });
            // Mise à jour locale instantanée
            setContenus(prev => prev.map(c => 
                c._id === id ? { ...c, statut_workflow: 'Valide' } : c
            ));
        } catch (err) {
            console.error("Erreur lors de la validation rapide :", err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // ==========================================
    // 📊 CALCULS DES METRIQUES EN TEMPS RÉEL
    // ==========================================
    
    // 1. KPI Contenus
    const totalContenus = contenus.length;
    const publiesCount = contenus.filter(c => c.statut_workflow === 'Publie').length;

    // 2. KPI À Valider
    const aValiderContenus = contenus.filter(c => c.statut_workflow === 'A valider');
    const aValiderCount = aValiderContenus.length;

    // 3. KPI Campagnes Actives
    const campagnesActives = campagnes.filter(c => c.statut === 'Active');
    const campagnesActivesCount = campagnesActives.length;
    const totalCampagnesCount = campagnes.length;

    // 4. KPI Coût / Lead
    const totalDepenseActives = campagnesActives.reduce((sum, c) => sum + (c.depense || 0), 0);
    const totalLeadsActives = campagnesActives.reduce((sum, c) => sum + (c.leads || 0), 0);
    const coutParLead = totalLeadsActives > 0 
        ? (totalDepenseActives / totalLeadsActives).toFixed(2) 
        : "0.00";

    // 5. Extraction du nom de marque pour un contenu
    const getBrandName = (c) => {
        if (c.tournage_id && typeof c.tournage_id === 'object' && c.tournage_id.marque_id) {
            return c.tournage_id.marque_id.nom || 'Sans marque';
        }
        if (c.marque_id && typeof c.marque_id === 'object') {
            return c.marque_id.nom;
        }
        return 'Sans marque';
    };

    // ==========================================
    // 📈 CONFIGURATION & CALCULS GRAPHICS (SVG)
    // ==========================================

    // A. Pipeline Contenu (Bar Chart)
    const statutsWorkflow = ['A faire', 'En cours', 'A valider', 'Valide', 'Publie'];
    const labelStatuts = {
        'A faire': 'À faire',
        'En cours': 'En cours',
        'A valider': 'À valider',
        'Valide': 'Validé',
        'Publie': 'Publié'
    };
    
    const pipelineCounts = statutsWorkflow.map(status => ({
        statusKey: status,
        label: labelStatuts[status],
        count: contenus.filter(c => c.statut_workflow === status).length
    }));

    const maxPipelineValue = Math.max(...pipelineCounts.map(d => d.count), 4); // Échelle minimale de 4

    // B. Répartition par pilier (Donut Chart)
    const pilierCounts = contenus.reduce((acc, c) => {
        const pilier = c.pilier || 'Non défini';
        acc[pilier] = (acc[pilier] || 0) + 1;
        return acc;
    }, {});

    const totalPiliersCount = Object.values(pilierCounts).reduce((a, b) => a + b, 0);

    // Construction des parts du donut (avec coordonnées de tracé pourcentage)
    let accumulatedPercent = 0;
    const donutSlices = Object.entries(pilierCounts).map(([name, count], index) => {
        const percent = totalPiliersCount > 0 ? (count / totalPiliersCount) * 100 : 0;
        // SVG stroke-dasharray utilise des valeurs sur une circonférence de 100
        const strokeDashArray = `${percent} ${100 - percent}`;
        const strokeDashOffset = 100 - accumulatedPercent;
        accumulatedPercent += percent;

        return {
            name,
            count,
            percent,
            strokeDashArray,
            strokeDashOffset,
            color: PILIER_COLORS[index % PILIER_COLORS.length]
        };
    });

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            
            {/* ==========================================
                EN-TÊTE
               ========================================== */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Vue d'ensemble de vos <span className="font-semibold text-blue-600">{marques.length}</span> marques
                </p>
            </div>

            {/* ==========================================
                CARTES KPI SENSAS
               ========================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* 1. Contenus */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contenus</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalContenus}</p>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            {/* Icone Document */}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium">
                        <span className="font-bold text-gray-700">{publiesCount}</span> publiés
                    </p>
                </div>

                {/* 2. À valider */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">À valider</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{aValiderCount}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${aValiderCount > 0 ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'}`}>
                            {/* Icone Alerte */}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium">
                        {aValiderCount > 0 ? <span className="text-amber-600 font-semibold">En attente de validation</span> : "En attente"}
                    </p>
                </div>

                {/* 3. Campagnes Actives */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campagnes Actives</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{campagnesActivesCount}</p>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl">
                            {/* Icone Mégaphone */}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium">
                        <span className="font-bold text-gray-700">{totalCampagnesCount}</span> au total
                    </p>
                </div>

                {/* 4. Coût / Lead */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Coût / Lead</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{coutParLead}€</p>
                        </div>
                        <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl">
                            {/* Icone Cible */}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium">
                        <span className="font-bold text-gray-700">{totalLeadsActives}</span> leads générés
                    </p>
                </div>

            </div>

            {/* ==========================================
                SECTION DES GRAPHIQUES (SVG NATIFS)
               ========================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* A. Pipeline Contenu (Bar Chart) - Colonnes: 7 */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-7">
                    <h3 className="text-sm font-bold text-gray-800 mb-6">Pipeline contenu</h3>
                    
                    <div className="relative w-full h-[240px]">
                        {/* On crée le graphique SVG réactif */}
                        <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                            {/* Lignes d'échelle horizontales (Grid) */}
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

                            {/* Tracé des barres */}
                            {pipelineCounts.map((d, index) => {
                                const barWidth = 36;
                                const xGap = (430 / pipelineCounts.length);
                                const xPos = 60 + index * xGap + (xGap - barWidth) / 2;
                                
                                // Calcul de hauteur avec transition CSS Tailwind
                                const targetHeight = d.count > 0 ? (d.count / maxPipelineValue) * 150 : 4;
                                const barHeight = animateCharts ? targetHeight : 0;
                                const yPos = 190 - barHeight;

                                return (
                                    <g key={d.statusKey} className="group cursor-pointer">
                                        {/* Infobulle simple au survol */}
                                        <title>{`${d.label} : ${d.count} contenus`}</title>
                                        
                                        {/* Barre en pur SVG */}
                                        <rect
                                            x={xPos}
                                            y={yPos}
                                            width={barWidth}
                                            height={barHeight}
                                            rx="6"
                                            fill="#3b49df"
                                            className="transition-all duration-1000 ease-out hover:fill-blue-700"
                                        />

                                        {/* Texte de valeur en haut de chaque barre */}
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
                            
                            {/* Ligne de base (X-axis) */}
                            <line x1="45" y1="190" x2="480" y2="190" stroke="#d1d5db" strokeWidth="1" />
                        </svg>

                        {/* Labels d'axe X positionnés de manière réactive sous le SVG */}
                        <div className="absolute left-[45px] right-[20px] bottom-1 flex justify-between text-[11px] font-bold text-gray-500 px-2">
                            {pipelineCounts.map(d => (
                                <span key={d.statusKey} className="w-[70px] text-center truncate">
                                    {d.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* B. Répartition par pilier (Donut Chart) - Colonnes: 5 */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-5 flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Répartition par pilier</h3>
                    
                    {totalPiliersCount === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic py-12">
                            Aucune donnée de pilier disponible
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                            {/* Cercle Donut SVG */}
                            <div className="relative w-36 h-36">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                                    {/* Fond gris du cercle */}
                                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="5.5" />
                                    
                                    {/* Segments de couleurs animés */}
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
                                {/* Texte central avec le total */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-gray-800">{totalContenus}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                                </div>
                            </div>

                            {/* Légende interactive */}
                            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                                {donutSlices.map((slice, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                                        <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">
                                            {slice.name}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            ({slice.count})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* ==========================================
                🚨 MODULE "CONTENUS À VALIDER" (BAS DE PAGE)
               ========================================== */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Contenus à valider</h3>
                </div>

                {aValiderCount === 0 ? (
                    <div className="bg-gray-50/50 rounded-xl py-12 text-center text-sm font-medium text-gray-500 border border-dashed border-gray-100">
                        Aucun contenu en attente de validation 🎉
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">Titre</th>
                                    <th className="py-3 px-4">Marque</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {aValiderContenus.map(c => (
                                    <tr key={c._id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-gray-900 truncate max-w-[220px]">
                                            {c.titre}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-blue-600">
                                            {getBrandName(c)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {c.type_contenu || 'Format libre'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => handleApprouverContenu(c._id)}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 font-bold text-xs rounded-full transition-all active:scale-95 shadow-sm"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
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

        </div>
    );
};

export default Dashboard;