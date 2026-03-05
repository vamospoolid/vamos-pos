import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vamos.admin',
  appName: 'Vamos Admin',
  webDir: 'dist',
  // Dev server — allows live reload during development on device
  // Comment this out before building the production APK
  server: {
    url: 'http://10.0.2.2:5175', // Android emulator → host localhost
    cleartext: true,             // allow HTTP (non-HTTPS) on Android
  },
  android: {
    allowMixedContent: true,     // allow API calls to HTTP backend
    backgroundColor: '#0a0a0a',  // match --vamos-dark
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;

