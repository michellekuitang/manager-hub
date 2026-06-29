import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tournages from './pages/Tournages';
import Campagnes from './pages/Campagnes';
import Workflow from './pages/Workflow';
import Marques from './pages/Marques';
import Intervenants from './pages/Intervenants';
import GenerateurIA from './pages/GenerateurIA';
import NotFound from './pages/NotFound';
import Equipes from './pages/Equipes';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return <div className="p-6">Chargement...</div>;
    return token ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Layout><Dashboard /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/tournages" element={
                        <PrivateRoute>
                            <Layout><Tournages /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/campagnes" element={
                        <PrivateRoute>
                            <Layout><Campagnes /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/workflow" element={
                        <PrivateRoute>
                            <Layout><Workflow /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/marques" element={
                        <PrivateRoute>
                            <Layout><Marques /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/intervenants" element={
                        <PrivateRoute>
                            <Layout><Intervenants /></Layout>
                        </PrivateRoute>
                    } />

                    {/* NOUVELLE ROUTE AJOUTÉE POUR L'ÉQUIPE */}
                    <Route path="/equipe" element={
                        <PrivateRoute>
                            <Layout><Equipes /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/generateur-ia" element={
                        <PrivateRoute>
                            <Layout><GenerateurIA /></Layout>
                        </PrivateRoute>
                    } />
                    
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;