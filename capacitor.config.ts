import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thionline.app',
  appName: 'TTVT Nho Quan',
  webDir: 'out',
  server: {
    // Trong development, có thể dùng localhost
    // Trong production, thay bằng URL server thực tế
    // url: 'http://localhost:3000',
    // cleartext: true, // Chỉ dùng trong development
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true, // Cho phép HTTP và HTTPS
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;

