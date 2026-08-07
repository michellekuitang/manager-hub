import { useNavigate } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-center px-4">
            <div className="p-4 bg-indigo-50 text-[#3e52b7] rounded-2xl mb-5">
                <CompassIcon size={28} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">404</h1>
            <p className="text-slate-500 mb-6">Cette page n'existe pas ou plus.</p>
            <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#3e52b7] hover:bg-[#34449a] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
            >
                Retour au tableau de bord
            </button>
        </div>
    );
};

export default NotFound;
