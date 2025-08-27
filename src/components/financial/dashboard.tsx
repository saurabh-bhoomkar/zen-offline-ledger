import { useState } from 'react';
import { Account, Currency } from '@/types/finance';
import { AccountCard } from './account-card';
import { AddAccountDialog } from './add-account-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccounts } from '@/hooks/useLocalStorage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Download, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown,
  Wallet
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { accounts, addAccount } = useAccounts();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const defaultCurrency: Currency = 'USD';

  const totalBalance = accounts.reduce((sum: number, account: Account) => {
    // In a real app, convert currencies to default currency
    return sum + account.balance;
  }, 0);

  const positiveAccounts = accounts.filter((acc: Account) => acc.balance > 0);
  const negativeAccounts = accounts.filter((acc: Account) => acc.balance < 0);

  const formatCurrency = (amount: number, currency: string = defaultCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const exportToCSV = async () => {
    try {
      // Create CSV content
      const headers = ['Account Name', 'Type', 'Balance', 'Currency', 'Created Date'];
      const csvContent = [
        headers.join(','),
        ...accounts.map((account: Account) => [
          `"${account.name}"`,
          account.type,
          account.balance,
          account.currency,
          new Date(account.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n');

      const fileName = `zen-ledger-backup-${new Date().toISOString().split('T')[0]}.csv`;

      // Write file to Downloads directory
      await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Documents, // Use Documents as Downloads may not be accessible
        encoding: Encoding.UTF8,
      });

      toast({
        title: "Backup exported successfully",
        description: `File saved as ${fileName} in Documents folder`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Unable to export backup file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Zen Ledger</h1>
            <Badge variant="outline" className="text-xs">
              🔒 Offline Secure
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Backup
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Balance Overview */}
        <Card className="bg-gradient-card shadow-card border-border mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Balance</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${
                  totalBalance >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {balanceVisible ? formatCurrency(totalBalance) : '••••••'}
                </p>
                <p className="text-muted-foreground mt-1">
                  Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center text-success text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {positiveAccounts.length} positive
                </div>
                {negativeAccounts.length > 0 && (
                  <div className="flex items-center text-destructive text-sm">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    {negativeAccounts.length} negative
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Accounts</h2>
          <AddAccountDialog 
            onAddAccount={addAccount}
            defaultCurrency={defaultCurrency}
          />
        </div>

        {accounts.length === 0 ? (
          <Card className="bg-gradient-card shadow-card border-border">
            <CardContent className="p-12 text-center">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by adding your first financial account to track your balances securely.
              </p>
              <AddAccountDialog 
                onAddAccount={addAccount}
                defaultCurrency={defaultCurrency}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account: Account) => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={() => {
                  // Navigate to account details
                  console.log('Navigate to account:', account.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {accounts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(positiveAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Assets</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(Math.abs(negativeAccounts.reduce((sum, acc) => sum + acc.balance, 0)))}
                  </p>
                  <p className="text-sm text-muted-foreground">Liabilities</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalBalance)}
                  </p>
                  <p className="text-sm text-muted-foreground">Net Worth</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}