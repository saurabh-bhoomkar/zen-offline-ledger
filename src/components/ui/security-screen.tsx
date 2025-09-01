import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useToast } from './use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SecurityScreenProps {
  isFirstLaunch?: boolean;
}

export function SecurityScreen({ isFirstLaunch = false }: SecurityScreenProps) {
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(isFirstLaunch);
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, setupPin: authSetupPin } = useAuth();

  const handleSetupComplete = async () => {
    if (setupPin === confirmPin && setupPin.length >= 4) {
      try {
        setIsLoading(true);
        await authSetupPin(setupPin);
        toast({
          title: "Setup Complete",
          description: "Your secure PIN has been set up successfully",
        });
      } catch (error) {
        toast({
          title: "Setup Failed",
          description: "Failed to set up PIN. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Error",
        description: "PINs don't match or PIN is too short",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async () => {
    if (!pin) return;
    
    setIsLoading(true);
    
    try {
      const success = await login(pin);
      if (success) {
        toast({
          title: "Success",
          description: "Successfully authenticated",
        });
      } else {
        toast({
          title: "Error",
          description: "Incorrect PIN",
          variant: "destructive",
        });
        setPin('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              disabled={setupPin !== confirmPin || setupPin.length < 4 || isLoading}
              className="w-full bg-gradient-primary shadow-button"
            >
              {isLoading ? 'Setting up...' : 'Complete Setup'}
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
            disabled={pin.length < 4 || isLoading}
            className="w-full bg-gradient-primary shadow-button"
          >
            {isLoading ? 'Authenticating...' : 'Unlock App'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}