import { useState } from 'react';
import { AuditEntry } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuditChart } from './audit-chart';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Edit, 
  Trash2, 
  BarChart3,
  Clock
} from 'lucide-react';

interface AuditTrailProps {
  auditTrail: AuditEntry[];
  onClearTrail: () => void;
}

export function AuditTrail({ auditTrail, onClearTrail }: AuditTrailProps) {
  const [chartOpen, setChartOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4 text-success" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-warning" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'created':
        return 'default';
      case 'updated':
        return 'secondary';
      case 'deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrendIcon = (changeAmount: number) => {
    if (changeAmount > 0) {
      return <TrendingUp className="h-3 w-3 text-success" />;
    } else if (changeAmount < 0) {
      return <TrendingDown className="h-3 w-3 text-destructive" />;
    }
    return null;
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Audit Trail</CardTitle>
            <Badge variant="outline" className="text-xs">
              {auditTrail.length} entries
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={chartOpen} onOpenChange={setChartOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Chart
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Balance History Chart</DialogTitle>
                </DialogHeader>
                <AuditChart auditTrail={auditTrail} />
              </DialogContent>
            </Dialog>
            {auditTrail.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearTrail}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {auditTrail.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit entries yet</p>
            <p className="text-sm text-muted-foreground">
              Activity will appear here as you manage your accounts
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {auditTrail.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {entry.accountName}
                        </p>
                        <Badge variant={getActionVariant(entry.action)} className="text-xs">
                          {entry.action}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(entry.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {entry.description}
                    </p>
                    {entry.changeAmount !== 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">
                            {formatCurrency(entry.previousBalance)} →
                          </span>
                          <span className="font-medium">
                            {formatCurrency(entry.newBalance)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(entry.changeAmount)}
                          <span className={`font-medium ${
                            entry.changeAmount > 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {entry.changeAmount > 0 ? '+' : ''}
                            {formatCurrency(entry.changeAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}