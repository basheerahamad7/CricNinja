import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cricninja.app',
  appName: 'CricNinja',
  webDir: 'out', // Next.js 'output: export' generates files in 'out'
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#4285F4' // Matches primary brand color
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4285F4',
      showSpinner: true,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
