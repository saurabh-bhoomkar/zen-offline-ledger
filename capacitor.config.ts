import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d7ec23cff1b14b64a9b179d6e4a6cb58',
  appName: 'zen-offline-ledger',
  webDir: 'dist',
  server: {
    url: 'https://d7ec23cf-f1b1-4b64-a9b1-79d6e4a6cb58.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;