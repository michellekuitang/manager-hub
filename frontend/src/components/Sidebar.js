import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Workflow,
  Megaphone,
  Clapperboard,
  CalendarClock,
  Award,
  Users,          // Pour Équipe
  UserCheck,
  Layers3,
  BarChart3,
  BotMessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const liens = [
        // --- CATEGORIE : GENERAL ---
        { path: '/dashboard', label: 'Tableau de bord', categorie: 'GENERAL', icon: LayoutDashboard },
        // { path: '/planning', label: 'Planning', categorie: 'GENERAL', icon: Calendar },
        { path: '/workflow', label: 'Workflow', categorie: 'GENERAL', icon: Workflow },
        { path: '/campagnes', label: 'Campagnes', categorie: 'GENERAL', icon: Megaphone },

        // --- CATEGORIE : TOURNAGES ---
        { path: '/tournages', label: 'Tournages', categorie: 'TOURNAGES', icon: Clapperboard },
        { path: '/calendrier-creneaux', label: 'Calendrier créneaux', categorie: 'TOURNAGES', icon: CalendarClock },

        // --- CATEGORIE : ADMINISTRATEUR ---
        { path: '/marques', label: 'Marques', categorie: 'ADMINISTRATEUR', icon: Award },
        { path: '/equipe', label: 'Équipe', categorie: 'ADMINISTRATEUR', icon: Users },
        { path: '/intervenants', label: 'Intervenants', categorie: 'ADMINISTRATEUR', icon: UserCheck },
        { path: '/templates', label: 'Templates', categorie: 'ADMINISTRATEUR', icon: Layers3 },
        { path: '/rapport', label: 'Rapport', categorie: 'ADMINISTRATEUR', icon: BarChart3 },
        { path: '/generateur-ia', label: 'Générateur IA', categorie: 'ADMINISTRATEUR', icon: BotMessageSquare },
    ];

    const categories = [...new Set(liens.map(l => l.categorie))];
    const initiale = user?.prenom ? user.prenom.charAt(0).toUpperCase() : 'M';

    return (
        <div className={`h-screen flex-shrink-0 bg-[#111827] text-gray-100 flex flex-col border-r border-gray-800 transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
        }`}>
            {/* HAUT : Logo & En-tête (taille fixe) */}
            <div className={`p-5 border-b border-gray-800 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                    H
                </div>
                {!isCollapsed && (
                    <div className="transition-opacity duration-200">
                        <h1 className="text-md font-bold text-white tracking-wide">Manager Hub</h1>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wider">ESIIA</p>
                    </div>
                )}
            </div>

            {/* MILIEU : Navigation (occupe l'espace restant, scrolle seule si besoin) */}
            <nav className="p-4 flex-1 min-h-0 overflow-y-auto">
                {categories.map(cat => (
                    <div key={cat} className="mb-6">
                        {isCollapsed ? (
                            <div className="border-b border-gray-800 my-2 mx-2"></div>
                        ) : (
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-3 mb-2 transition-opacity duration-200">
                                {cat === 'TOURNAGES' ? 'TOURNAGES' : cat}
                            </p>
                        )}
                        <div className="space-y-1">
                            {liens
                                .filter(l => l.categorie === cat)
                                .map(l => {
                                    const IconeComponent = l.icon;
                                    return (
                                        <NavLink
                                            key={l.path}
                                            to={l.path}
                                            title={isCollapsed ? l.label : ""}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                                    isCollapsed ? 'justify-center' : ''
                                                } ${
                                                    isActive
                                                        ? 'bg-blue-600/10 text-blue-400 font-semibold'
                                                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                                                }`
                                            }
                                        >
                                            <IconeComponent size={18} strokeWidth={2} className="flex-shrink-0" />
                                            {!isCollapsed && <span className="transition-opacity duration-200 truncate">{l.label}</span>}
                                        </NavLink>
                                    );
                                })
                            }
                        </div>
                    </div>
                ))}
            </nav>

            {/* BAS : Bouton Chevron & Espace Utilisateur (taille fixe, toujours visible) */}
            <div className="flex-shrink-0">
                <div className="p-2 border-t border-gray-800 flex justify-end">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors w-full flex justify-center items-center"
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <div className="border-t border-gray-800 bg-[#0b0f19]">
                    <div className={`pt-4 pb-2 flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                            {initiale}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col truncate transition-opacity duration-200">
                                <span className="text-sm font-semibold text-white truncate">
                                    {user?.prenom || 'Michelle'} {user?.nom || 'Kuitang'}
                                </span>
                                <span className="text-[11px] text-gray-400 truncate">Connectée</span>
                            </div>
                        )}
                    </div>

                    <div className="px-4 pb-4">
                        <button
                            onClick={logout}
                            title={isCollapsed ? "Déconnexion" : ""}
                            className={`w-full flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors font-medium ${
                                isCollapsed ? 'justify-center' : ''
                            }`}
                        >
                            <LogOut size={16} className="flex-shrink-0" />
                            {!isCollapsed && <span>Déconnexion</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;