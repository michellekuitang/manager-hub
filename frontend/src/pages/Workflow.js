import { useState, useEffect } from 'react';
import api from '../services/api';

const STATUTS = ['A faire', 'En cours', 'A valider', 'Valide', 'Publie'];

const Workflow = () => {
    const [contenus, setContenus] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContenus = async () => {
            try {
                const res = await api.get('/contenus');
                setContenus(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContenus();
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Workflow Contenus</h1>
            <div className="grid grid-cols-5 gap-3">
                {STATUTS.map(statut => (
                    <div key={statut} className="bg-gray-100 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">{statut}</h3>
                        <div className="space-y-2">
                            {contenus
                                .filter(c => c.statut_workflow === statut)
                                .map(c => (
                                    <div key={c._id} className="bg-white rounded p-2 shadow-sm">
                                        <p className="text-sm font-medium text-gray-800">{c.titre}</p>
                                        <p className="text-xs text-gray-500">{c.type_contenu}</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Workflow;