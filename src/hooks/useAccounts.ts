import { useCallback } from 'react';
import { Account, AuditEntry } from '@/types/finance';
import { useSecureStorage } from './useSecureStorage';
import { useAuth } from './useAuth';

export function useAccounts() {
  const { currentPin } = useAuth();
  
  const {
    value: accounts,
    setValue: setAccounts,
    loadData: loadAccountsData,
    isLoaded: accountsLoaded,
    error: accountsError
  } = useSecureStorage<Account[]>('zenLedger_accounts', [], true);

  const {
    value: auditTrail,
    setValue: setAuditTrail,
    loadData: loadAuditData,
    isLoaded: auditLoaded,
    error: auditError
  } = useSecureStorage<AuditEntry[]>('zenLedger_audit', [], true);

  // Load all encrypted data
  const loadEncryptedData = useCallback(async (pin?: string) => {
    const pinToUse = pin || currentPin;
    if (!pinToUse) {
      throw new Error('No PIN available for data decryption');
    }

    await Promise.all([
      loadAccountsData(pinToUse),
      loadAuditData(pinToUse)
    ]);
  }, [currentPin, loadAccountsData, loadAuditData]);

  const addAuditEntry = useCallback(async (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const auditEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    await setAuditTrail((prev) => [auditEntry, ...prev], currentPin);
  }, [setAuditTrail, currentPin]);

  const addAccount = useCallback(async (newAccount: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const account: Account = {
      ...newAccount,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setAccounts((prev) => [...prev, account], currentPin);
    
    // Add audit entry
    await addAuditEntry({
      accountId: account.id,
      accountName: account.name,
      previousBalance: 0,
      newBalance: account.balance,
      changeAmount: account.balance,
      action: 'created',
      description: `Account "${account.name}" created with balance ${account.balance} ${account.currency}`,
    });
    
    return account;
  }, [setAccounts, currentPin, addAuditEntry]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const existingAccount = accounts.find(acc => acc.id === id);
    if (!existingAccount) return;

    const previousBalance = existingAccount.balance;
    const newBalance = updates.balance !== undefined ? updates.balance : previousBalance;
    const changeAmount = newBalance - previousBalance;

    await setAccounts((prev) => 
      prev.map(account => 
        account.id === id 
          ? { ...account, ...updates, updatedAt: new Date() }
          : account
      ), currentPin
    );

    // Add audit entry for balance changes
    if (changeAmount !== 0) {
      await addAuditEntry({
        accountId: id,
        accountName: updates.name || existingAccount.name,
        previousBalance,
        newBalance,
        changeAmount,
        action: 'updated',
        description: `Balance ${changeAmount > 0 ? 'increased' : 'decreased'} by ${Math.abs(changeAmount)} ${existingAccount.currency}`,
      });
    } else if (updates.name && updates.name !== existingAccount.name) {
      await addAuditEntry({
        accountId: id,
        accountName: updates.name,
        previousBalance,
        newBalance,
        changeAmount: 0,
        action: 'updated',
        description: `Account renamed from "${existingAccount.name}" to "${updates.name}"`,
      });
    }
  }, [accounts, setAccounts, currentPin, addAuditEntry]);

  const deleteAccount = useCallback(async (id: string) => {
    const existingAccount = accounts.find(acc => acc.id === id);
    if (!existingAccount) return;

    await setAccounts((prev) => prev.filter(account => account.id !== id), currentPin);
    
    // Add audit entry
    await addAuditEntry({
      accountId: id,
      accountName: existingAccount.name,
      previousBalance: existingAccount.balance,
      newBalance: 0,
      changeAmount: -existingAccount.balance,
      action: 'deleted',
      description: `Account "${existingAccount.name}" deleted`,
    });
  }, [accounts, setAccounts, currentPin, addAuditEntry]);

  const clearAllAccounts = useCallback(async () => {
    // Add audit entries for all deleted accounts
    for (const account of accounts) {
      await addAuditEntry({
        accountId: account.id,
        accountName: account.name,
        previousBalance: account.balance,
        newBalance: 0,
        changeAmount: -account.balance,
        action: 'deleted',
        description: `Account "${account.name}" deleted (bulk clear)`,
      });
    }
    
    await setAccounts([], currentPin);
  }, [accounts, setAccounts, currentPin, addAuditEntry]);

  const clearAuditTrail = useCallback(async () => {
    await setAuditTrail([], currentPin);
  }, [setAuditTrail, currentPin]);

  return {
    accounts,
    auditTrail,
    addAccount,
    updateAccount,
    deleteAccount,
    clearAllAccounts,
    clearAuditTrail,
    loadEncryptedData,
    isLoaded: accountsLoaded && auditLoaded,
    error: accountsError || auditError
  };
}