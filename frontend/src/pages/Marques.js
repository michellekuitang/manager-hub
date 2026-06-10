import { useState, useEffect } from 'react';
import api from '../services/api';

const Marques = () => {
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarques = async () => {
            try {
                const res = await api.get('/marques');
                setMarques(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarques();
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Marques</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Nouvelle marque
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marques.length === 0 ? (
                    <p className="text-gray-500">Aucune marque pour le moment.</p>
                ) : (
                    marques.map(m => (
                        <div key={m._id} className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-gray-800">{m.nom}</h3>
                            <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                            <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${m.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {m.actif ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Marques;