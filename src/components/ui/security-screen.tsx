import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Shield, Lock, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface SecurityScreenProps {
  onAuthenticated: () => void;
  isFirstLaunch?: boolean;
}

export function SecurityScreen({ onAuthenticated, isFirstLaunch = false }: SecurityScreenProps) {
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(isFirstLaunch);
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSetupComplete = () => {
    if (setupPin === confirmPin && setupPin.length >= 4) {
      // Store PIN hash in localStorage (in real app, use secure storage)
      localStorage.setItem('zenLedgerPin', setupPin);
      localStorage.setItem('zenLedgerFirstLaunch', 'false');
      onAuthenticated();
    }
  };

  const handleLogin = () => {
    const storedPin = localStorage.getItem('zenLedgerPin');
    if (pin === storedPin) {
      onAuthenticated();
    } else {
      setPin('');
      // Show error toast in real implementation
    }
  };

  const handleBiometric = () => {
    // Simulate biometric authentication
    setTimeout(() => {
      onAuthenticated();
    }, 1000);
  };

  if (isSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-card shadow-card border-border animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Zen Ledger</CardTitle>
            <CardDescription>
              Set up your secure PIN to protect your financial data. This app works completely offline for maximum security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Create PIN (4+ digits)</label>
              <Input
                type="password"
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value)}
                placeholder="Enter PIN"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Confirm PIN</label>
              <Input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm PIN"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSetupComplete}
              disabled={setupPin !== confirmPin || setupPin.length < 4}
              className="w-full bg-gradient-primary shadow-button"
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card shadow-card border-border animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Zen Ledger</CardTitle>
          <CardDescription>
            Secure, offline financial tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleBiometric}
            variant="outline"
            className="w-full h-12 border-primary/20 hover:bg-primary/5"
          >
            <Fingerprint className="mr-2 h-5 w-5" />
            Use Biometric Authentication
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Enter PIN</label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="mt-1"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
          <Button
            onClick={handleLogin}
            disabled={pin.length < 4}
            className="w-full bg-gradient-primary shadow-button"
          >
            Unlock App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}