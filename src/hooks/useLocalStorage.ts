import { useState, useEffect } from 'react';
import { AuditEntry } from '@/types/finance';
import { encryptData, decryptData, getCurrentPin } from '@/lib/crypto';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      // Skip encryption for settings (contains PIN hash)
      if (key === 'zenLedger_settings') {
        return JSON.parse(item);
      }
      
      // For encrypted data, we need to check if it's already encrypted
      // If it starts with valid JSON, it's legacy unencrypted data
      try {
        JSON.parse(item);
        // Legacy unencrypted data - return as is for now
        return JSON.parse(item);
      } catch {
        // Data is encrypted, but we can't decrypt without PIN during initialization
        // Return initial value and let the app handle decryption after authentication
        return initialValue;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Skip encryption for settings
      if (key === 'zenLedger_settings') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return;
      }
      
      // Encrypt data before storing (async operation, but we don't wait)
      const pin = getCurrentPin();
      if (pin) {
        encryptData(JSON.stringify(valueToStore), pin)
          .then(encrypted => {
            window.localStorage.setItem(key, encrypted);
          })
          .catch(error => {
            console.error(`Error encrypting localStorage key "${key}":`, error);
            // Fallback to unencrypted storage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          });
      } else {
        // No PIN available, store unencrypted (fallback)
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const loadEncryptedData = async (pin: string) => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return;
      
      // Skip decryption for settings
      if (key === 'zenLedger_settings') return;
      
      try {
        // Check if data is already decrypted (legacy data)
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
      } catch {
        // Data is encrypted, decrypt it
        const decrypted = await decryptData(item, pin);
        const parsed = JSON.parse(decrypted);
        setStoredValue(parsed);
      }
    } catch (error) {
      console.error(`Error loading encrypted data for key "${key}":`, error);
    }
  };

  return [storedValue, setValue, loadEncryptedData] as const;
}

export function useAccounts() {
  const [accounts, setAccounts, loadAccountsData] = useLocalStorage('zenLedger_accounts', []);
  const [auditTrail, setAuditTrail, loadAuditData] = useLocalStorage<AuditEntry[]>('zenLedger_audit', []);

  const loadEncryptedData = async (pin: string) => {
    await Promise.all([
      loadAccountsData(pin),
      loadAuditData(pin)
    ]);
  };
  
  const addAuditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const auditEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setAuditTrail((prev) => [auditEntry, ...prev]);
  };

  const addAccount = (newAccount: any) => {
    const account = {
      ...newAccount,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAccounts((prev: any[]) => [...prev, account]);
    
    // Add audit entry
    addAuditEntry({
      accountId: account.id,
      accountName: account.name,
      previousBalance: 0,
      newBalance: account.balance,
      changeAmount: account.balance,
      action: 'created',
      description: `Account "${account.name}" created with balance ${account.balance} ${account.currency}`,
    });
    
    return account;
  };

  const updateAccount = (id: string, updates: any) => {
    const existingAccount = accounts.find((acc: any) => acc.id === id);
    if (!existingAccount) return;

    const previousBalance = existingAccount.balance;
    const newBalance = updates.balance !== undefined ? updates.balance : previousBalance;
    const changeAmount = newBalance - previousBalance;

    setAccounts((prev: any[]) => 
      prev.map(account => 
        account.id === id 
          ? { ...account, ...updates, updatedAt: new Date() }
          : account
      )
    );

    // Add audit entry for balance changes
    if (changeAmount !== 0) {
      addAuditEntry({
        accountId: id,
        accountName: updates.name || existingAccount.name,
        previousBalance,
        newBalance,
        changeAmount,
        action: 'updated',
        description: `Balance ${changeAmount > 0 ? 'increased' : 'decreased'} by ${Math.abs(changeAmount)} ${existingAccount.currency}`,
      });
    } else if (updates.name && updates.name !== existingAccount.name) {
      addAuditEntry({
        accountId: id,
        accountName: updates.name,
        previousBalance,
        newBalance,
        changeAmount: 0,
        action: 'updated',
        description: `Account renamed from "${existingAccount.name}" to "${updates.name}"`,
      });
    }
  };

  const deleteAccount = (id: string) => {
    const existingAccount = accounts.find((acc: any) => acc.id === id);
    if (!existingAccount) return;

    setAccounts((prev: any[]) => prev.filter(account => account.id !== id));
    
    // Add audit entry
    addAuditEntry({
      accountId: id,
      accountName: existingAccount.name,
      previousBalance: existingAccount.balance,
      newBalance: 0,
      changeAmount: -existingAccount.balance,
      action: 'deleted',
      description: `Account "${existingAccount.name}" deleted`,
    });
  };

  const clearAllAccounts = () => {
    // Add audit entries for all deleted accounts
    accounts.forEach((account: any) => {
      addAuditEntry({
        accountId: account.id,
        accountName: account.name,
        previousBalance: account.balance,
        newBalance: 0,
        changeAmount: -account.balance,
        action: 'deleted',
        description: `Account "${account.name}" deleted (bulk clear)`,
      });
    });
    
    setAccounts([]);
  };

  const clearAuditTrail = () => {
    setAuditTrail([]);
  };

  return { 
    accounts, 
    auditTrail, 
    addAccount, 
    updateAccount, 
    deleteAccount, 
    clearAllAccounts, 
    clearAuditTrail,
    loadEncryptedData
  };
}