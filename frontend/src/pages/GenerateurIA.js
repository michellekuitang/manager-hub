import { useState, useEffect } from 'react';
import api from '../services/api';

const GenerateurIA = () => {
    const [marques, setMarques] = useState([]);
    const [form, setForm] = useState({
        marque_id: '',
        marque_nom: '',
        pilier: 'Acquisition',
        type_contenu: 'carrousel',
        contexte: ''
    });
    const [resultat, setResultat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        const fetchMarques = async () => {
            try {
                const res = await api.get('/marques');
                setMarques(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMarques();
    }, []);

    const handleMarqueChange = (e) => {
        const marque = marques.find(m => m._id === e.target.value);
        setForm({ ...form, marque_id: e.target.value, marque_nom: marque?.nom || '' });
    };

    const handleGenerer = async () => {
        if (!form.marque_id) {
            setErreur('Veuillez selectionner une marque.');
            return;
        }
        setErreur('');
        setLoading(true);
        try {
            const res = await api.post('/ia/generer', form);
            setResultat(res.data);
        } catch (err) {
            setErreur('Erreur lors de la generation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Generateur IA</h1>
            <p className="text-gray-500 mb-6">Genere des idees de contenu pour le secteur educatif</p>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                        <select
                            onChange={handleMarqueChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="">Choisir une marque</option>
                            {marques.map(m => (
                                <option key={m._id} value={m._id}>{m.nom}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilier</label>
                        <select
                            value={form.pilier}
                            onChange={(e) => setForm({ ...form, pilier: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option>Acquisition</option>
                            <option>Engagement</option>
                            <option>Fidelisation</option>
                            <option>Notoriete</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
                        <select
                            value={form.type_contenu}
                            onChange={(e) => setForm({ ...form, type_contenu: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option>carrousel</option>
                            <option>reel</option>
                            <option>post</option>
                            <option>story</option>
                            <option>article</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contexte (facultatif)
                    </label>
                    <textarea
                        value={form.contexte}
                        onChange={(e) => setForm({ ...form, contexte: e.target.value })}
                        placeholder="Ex : Journee portes ouvertes le 15 juin, nouvelle formation data..."
                        className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none"
                    />
                </div>

                {erreur && <p className="text-red-500 text-sm mb-3">{erreur}</p>}

                <button
                    onClick={handleGenerer}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Generation en cours...' : 'Generer'}
                </button>
            </div>

            {resultat && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">Contenu genere</h2>
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Script</p>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded">{resultat.script}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Caption</p>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded">{resultat.caption}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerateurIA;