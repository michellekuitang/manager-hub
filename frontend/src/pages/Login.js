import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, Eye, EyeOff, Clapperboard, Workflow, BarChart3, BotMessageSquare } from 'lucide-react';

const ATOUTS = [
    { icon: Clapperboard, label: 'Planifiez vos tournages et créneaux' },
    { icon: Workflow, label: 'Suivez la production de contenu de bout en bout' },
    { icon: BarChart3, label: 'Générez des rapports hebdomadaires en un clic' },
    { icon: BotMessageSquare, label: "Accélérez la création avec l'IA" }
];

// Récupère le prénom de la dernière personne connectée sur cet appareil (persiste après déconnexion)
const getDernierPrenom = () => {
    try {
        const brut = localStorage.getItem('dernierUtilisateur');
        return brut ? JSON.parse(brut)?.prenom || '' : '';
    } catch {
        return '';
    }
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
    const [erreur, setErreur] = useState('');
    const [chargement, setChargement] = useState(false);
    const [dernierPrenom] = useState(getDernierPrenom);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur('');
        setChargement(true);
        try {
            const res = await api.post('/auth/login', {
                email,
                mot_de_passe: motDePasse
            });
            login(res.data.utilisateur, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setErreur('Email ou mot de passe incorrect.');
        } finally {
            setChargement(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">

            {/* PANNEAU DE MARQUE (masqué sur mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#111827] text-white flex-col justify-between p-12 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#3e52b7]/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-[#3e52b7]/20 rounded-full blur-3xl"></div>

                <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        H
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">Manager Hub</h1>
                        <p className="text-xs text-gray-400 font-medium tracking-wider">ESIIA</p>
                    </div>
                </div>

                <div className="relative">
                    <h2 className="text-3xl font-bold tracking-tight leading-tight mb-4">
                        La plateforme de pilotage<br />du contenu marketing ESIIA
                    </h2>
                    <p className="text-sm text-gray-400 mb-8 max-w-sm">
                        Tournages, workflow éditorial, campagnes et génération IA — tout au même endroit.
                    </p>

                    <div className="space-y-4">
                        {ATOUTS.map(({ icon: Icone, label }, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex-shrink-0">
                                    <Icone size={16} className="text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-300 font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-gray-500">© 2026 Manager Hub — ESIIA Service Marketing</p>
            </div>

            {/* FORMULAIRE */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#f8fafc]">
                <div className="w-full max-w-sm">

                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                            H
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-wide">Manager Hub</h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wider">ESIIA</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Connexion</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {dernierPrenom ? `Bon retour, ${dernierPrenom} !` : 'Connectez-vous pour continuer.'}
                        </p>
                    </div>

                    {erreur && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm font-medium">
                            {erreur}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vous@esiia.fr"
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] focus:ring-4 focus:ring-[#3e52b7]/10 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={afficherMotDePasse ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3e52b7] focus:ring-4 focus:ring-[#3e52b7]/10 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setAfficherMotDePasse(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {afficherMotDePasse ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={chargement}
                            className="w-full bg-[#3e52b7] hover:bg-[#34449a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl shadow-sm transition-all mt-2"
                        >
                            {chargement ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
