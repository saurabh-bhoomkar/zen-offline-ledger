import { Account } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, PiggyBank, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

const accountIcons = {
  checking: CreditCard,
  savings: PiggyBank,
  credit_card: CreditCard,
  investment: TrendingUp,
  cash: Wallet,
  loan: Briefcase,
  other: DollarSign,
};

const accountTypeLabels = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  investment: 'Investment',
  cash: 'Cash',
  loan: 'Loan',
  other: 'Other',
};

export function AccountCard({ account, onClick }: AccountCardProps) {
  const Icon = accountIcons[account.type];
  const isNegative = account.balance < 0;
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <Card 
      className="bg-gradient-card shadow-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{account.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {accountTypeLabels[account.type]}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-2xl font-bold ${
            isNegative ? 'text-destructive' : 'text-success'
          }`}>
            {formatCurrency(account.balance, account.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated {new Date(account.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}