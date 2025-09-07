import { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '@/lib/storage';

export function useSecureStorage<T>(
  key: string, 
  initialValue: T, 
  encrypt: boolean = true
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage
  const loadData = useCallback(async (pin?: string) => {
    try {
      console.log(`Loading data for key: ${key}, encrypt: ${encrypt}`);
      setError(null);
      const storedValue = await secureStorage.getItem(key, initialValue, { 
        encrypt, 
        pin 
      });
      console.log(`Data loaded for ${key}:`, !!storedValue);
      setValue(storedValue);
      setIsLoaded(true);
    } catch (err) {
      console.error(`Error loading ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [key, initialValue, encrypt]);

  // Save data to storage
  const saveData = useCallback(async (newValue: T | ((prev: T) => T), pin?: string) => {
    try {
      setError(null);
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value) 
        : newValue;
      
      setValue(valueToStore);
      await secureStorage.setItem(key, valueToStore, { encrypt, pin });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
      console.error(`Error saving ${key}:`, err);
      throw err;
    }
  }, [key, value, encrypt]);

  // Initial load for non-encrypted data
  useEffect(() => {
    if (!encrypt) {
      loadData();
    }
  }, [loadData, encrypt]);

  return {
    value,
    setValue: saveData,
    loadData,
    isLoaded,
    error,
    clearError: () => setError(null)
  };
}