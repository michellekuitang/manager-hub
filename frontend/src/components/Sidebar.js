import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();

    const liens = [
        { path: '/dashboard', label: 'Tableau de bord', categorie: 'GENERAL' },
        { path: '/workflow', label: 'Workflow Contenus', categorie: 'GENERAL' },
        { path: '/campagnes', label: 'Campagnes', categorie: 'GENERAL' },
        { path: '/tournages', label: 'Tournages', categorie: 'TOURNOIS' },
        { path: '/marques', label: 'Marques', categorie: 'ADMINISTRATEUR' },
        { path: '/generateur-ia', label: 'Generateur IA', categorie: 'ADMINISTRATEUR' },
    ];

    const categories = [...new Set(liens.map(l => l.categorie))];

    return (
        <div className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-lg font-bold text-blue-400">Manager Hub</h1>
                <p className="text-xs text-gray-400">ESIIA</p>
            </div>

            <nav className="flex-1 p-3">
                {categories.map(cat => (
                    <div key={cat} className="mb-4">
                        <p className="text-xs text-gray-500 uppercase px-3 mb-1">{cat}</p>
                        {liens
                            .filter(l => l.categorie === cat)
                            .map(l => (
                                <NavLink
                                    key={l.path}
                                    to={l.path}
                                    className={({ isActive }) =>
                                        `block px-3 py-2 rounded text-sm mb-1 transition ${
                                            isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700'
                                        }`
                                    }
                                >
                                    {l.label}
                                </NavLink>
                            ))
                        }
                    </div>
                ))}
            </nav>

            <div className="p-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">{user?.prenom} {user?.nom}</p>
                <button
                    onClick={logout}
                    className="w-full text-left text-sm text-red-400 hover:text-red-300 px-3 py-1"
                >
                    Deconnexion
                </button>
            </div>
        </div>
    );
};

export default Sidebar;