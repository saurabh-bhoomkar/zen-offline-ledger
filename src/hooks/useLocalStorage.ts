import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function useAccounts() {
  const [accounts, setAccounts] = useLocalStorage('zenLedger_accounts', []);
  
  const addAccount = (newAccount: any) => {
    const account = {
      ...newAccount,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAccounts((prev: any[]) => [...prev, account]);
    return account;
  };

  const updateAccount = (id: string, updates: any) => {
    setAccounts((prev: any[]) => 
      prev.map(account => 
        account.id === id 
          ? { ...account, ...updates, updatedAt: new Date() }
          : account
      )
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev: any[]) => prev.filter(account => account.id !== id));
  };

  return { accounts, addAccount, updateAccount, deleteAccount };
}