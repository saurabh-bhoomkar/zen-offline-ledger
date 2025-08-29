import { useState } from 'react';
import { SecurityScreen } from '@/components/ui/security-screen';
import { Dashboard } from '@/components/financial/dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if settings exist to determine first launch
  const getIsFirstLaunch = () => {
    try {
      const settings = localStorage.getItem('zenLedger_settings');
      return !settings || JSON.parse(settings).isFirstLaunch !== false;
    } catch {
      return true;
    }
  };
  
  const [isFirstLaunch] = useState(getIsFirstLaunch());

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
