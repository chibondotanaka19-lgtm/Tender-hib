import React, { useState } from 'react';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { TenderDetailsPage } from './pages/TenderDetailsPage';
import { Dashboard } from './pages/Dashboard';
import { CreateTenderPage } from './pages/CreateTenderPage';
import { ProfilePage } from './pages/ProfilePage';

function AppContent() {
  const { loading } = useFirebase();
  const [currentPage, setCurrentPage] = useState<'home' | 'tender-details' | 'dashboard' | 'create' | 'profile'>('home');
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  const navigateToHome = () => setCurrentPage('home');
  const navigateToDashboard = () => setCurrentPage('dashboard');
  const navigateToCreate = () => setCurrentPage('create');
  const navigateToProfile = () => setCurrentPage('profile');
  const navigateToTender = (id: string) => {
    setSelectedTenderId(id);
    setCurrentPage('tender-details');
  };

  return (
    <Layout 
      setCurrentPage={setCurrentPage} 
      navigateToHome={navigateToHome}
      navigateToDashboard={navigateToDashboard}
      navigateToProfile={navigateToProfile}
    >
      {currentPage === 'home' && <Home onTenderClick={navigateToTender} />}
      {currentPage === 'tender-details' && selectedTenderId && (
        <TenderDetailsPage tenderId={selectedTenderId} onBack={navigateToHome} />
      )}
      {currentPage === 'dashboard' && (
        <Dashboard 
          onTenderClick={navigateToTender} 
          onCreate={navigateToCreate} 
        />
      )}
      {currentPage === 'create' && <CreateTenderPage onBack={navigateToDashboard} />}
      {currentPage === 'profile' && <ProfilePage onBack={navigateToDashboard} />}
    </Layout>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

