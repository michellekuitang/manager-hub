import { useState, useEffect } from 'react';
import api from '../services/api';

const Tournages = () => {
    const [tournages, setTournages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournages = async () => {
            try {
                const res = await api.get('/tournages');
                setTournages(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTournages();
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tournages</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Nouveau tournage
                </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lieu</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marque</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tournages.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    Aucun tournage pour le moment.
                                </td>
                            </tr>
                        ) : (
                            tournages.map(t => (
                                <tr key={t._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-800">{t.titre}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(t.date_tournage).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{t.lieu}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                            {t.statut}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {t.marque_id?.nom}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Tournages;