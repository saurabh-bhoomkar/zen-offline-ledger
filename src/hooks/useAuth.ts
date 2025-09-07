import { useState, useEffect } from 'react';
import { secureStorage } from '@/lib/storage';
import { UserSettings } from '@/types/finance';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPin, setCurrentPin] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if we have a stored session
        const sessionData = sessionStorage.getItem('zenLedger_session');
        if (sessionData) {
          const { pin, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionAge = now - timestamp;
          
          // Session expires after 1 hour
          if (sessionAge < 60 * 60 * 1000) {
            setCurrentPin(pin);
            secureStorage.setPin(pin);
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('zenLedger_session');
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        sessionStorage.removeItem('zenLedger_session');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      const settings = await secureStorage.getItem<UserSettings>('zenLedger_settings', {
        defaultCurrency: 'USD',
        biometricEnabled: false,
        isFirstLaunch: true
      }, { encrypt: false });

      if (settings.pinHash === pin) {
        setCurrentPin(pin);
        secureStorage.setPin(pin);
        setIsAuthenticated(true);
        
        // Store session data
        sessionStorage.setItem('zenLedger_session', JSON.stringify({
          pin,
          timestamp: Date.now()
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentPin(null);
    secureStorage.clearPin();
    sessionStorage.removeItem('zenLedger_session');
  };

  const setupPin = async (pin: string): Promise<void> => {
    const settings: UserSettings = {
      pinHash: pin,
      isFirstLaunch: false,
      defaultCurrency: 'USD',
      biometricEnabled: false
    };
    
    await secureStorage.setItem('zenLedger_settings', settings, { encrypt: false });
    setCurrentPin(pin);
    secureStorage.setPin(pin);
    setIsAuthenticated(true);
    
    // Store session data
    sessionStorage.setItem('zenLedger_session', JSON.stringify({
      pin,
      timestamp: Date.now()
    }));
  };

  return {
    isAuthenticated,
    isLoading,
    currentPin,
    login,
    logout,
    setupPin
  };
}