import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.horizon.financial',
  appName: 'Horizon',
  webDir: 'out',
  server: {
    // For development, point to your local Next.js server
    // url: 'http://localhost:3000',
    // For production, use the bundled web assets
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Horizon',
    backgroundColor: '#0C0F14',
  },
  android: {
    backgroundColor: '#0C0F14',
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0C0F14',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0C0F14',
      showSpinner: false,
    },
  },
};

export default config;
