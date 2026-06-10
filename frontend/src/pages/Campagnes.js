import { useState, useEffect } from 'react';
import api from '../services/api';

const Campagnes = () => {
    const [campagnes, setCampagnes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampagnes = async () => {
            try {
                const res = await api.get('/campagnes');
                setCampagnes(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampagnes();
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Campagnes</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Nouvelle campagne
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campagnes.length === 0 ? (
                    <p className="text-gray-500">Aucune campagne pour le moment.</p>
                ) : (
                    campagnes.map(c => (
                        <div key={c._id} className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-gray-800">{c.nom}</h3>
                            <p className="text-sm text-gray-500">{c.marque_id?.nom}</p>
                            <div className="mt-2 flex justify-between">
                                <span className="text-sm text-gray-600">Budget : {c.budget}€</span>
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    {c.statut}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Campagnes;