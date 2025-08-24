import { useState } from 'react';
import { SecurityScreen } from '@/components/ui/security-screen';
import { Dashboard } from '@/components/financial/dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch] = useState(localStorage.getItem('zenLedgerFirstLaunch') !== 'false');

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <SecurityScreen 
        onAuthenticated={handleAuthenticated}
        isFirstLaunch={isFirstLaunch}
      />
    );
  }

  return <Dashboard onLogout={handleLogout} />;
};

export default Index;
