import { useState, useEffect } from 'react';
import { SecurityScreen } from '@/components/ui/security-screen';
import { Dashboard } from '@/components/financial/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loadEncryptedData, isLoaded: dataLoaded } = useAccounts();
  
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

  // Load encrypted data after authentication
  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      loadEncryptedData().catch(console.error);
    }
  }, [isAuthenticated, dataLoaded, loadEncryptedData]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <SecurityScreen 
        isFirstLaunch={isFirstLaunch}
      />
    );
  }

  // Show loading while data is being decrypted
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your secure data...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;