import { useState, useEffect } from 'react';
import { AuditEntry } from '@/types/finance';

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
  const [auditTrail, setAuditTrail] = useLocalStorage<AuditEntry[]>('zenLedger_audit', []);
  
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
    clearAuditTrail 
  };
}