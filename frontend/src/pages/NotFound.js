import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
            <p className="text-gray-500 mb-4">Page non trouvee.</p>
            <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Retour au tableau de bord
            </button>
        </div>
    );
};

export default NotFound;