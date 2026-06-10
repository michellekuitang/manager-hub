import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        contenus: 0,
        aValider: 0,
        campagnesActives: 0,
        coutParLead: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [contenus, campagnes] = await Promise.all([
                    api.get('/contenus'),
                    api.get('/campagnes')
                ]);

                const aValider = contenus.data.filter(c => c.statut_workflow === 'A valider').length;
                const actives = campagnes.data.filter(c => c.statut === 'Active');
                const coutLead = actives.length > 0
                    ? (actives.reduce((sum, c) => sum + (c.budget || 0), 0) /
                       actives.reduce((sum, c) => sum + (c.leads_actuels || 1), 0)).toFixed(2)
                    : 0;

                setStats({
                    contenus: contenus.data.length,
                    aValider,
                    campagnesActives: actives.length,
                    coutParLead: coutLead
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Tableau de bord</h1>
            <p className="text-gray-500 mb-6">Vue d'ensemble de vos marques</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-xs text-gray-500 uppercase">Contenus</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.contenus}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-xs text-gray-500 uppercase">A valider</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.aValider}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-xs text-gray-500 uppercase">Campagnes actives</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.campagnesActives}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-xs text-gray-500 uppercase">Cout/Lead</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.coutParLead}€</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;