import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.goldeninternationalacademy.android',
  appName: 'Planet of Science',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;