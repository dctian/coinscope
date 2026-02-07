import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.coinscope.app",
  appName: "CoinScope",
  webDir: "dist",
  server: {
    // Use http scheme so the WebView can reach the local HTTP backend
    // without mixed-content blocking (default is https://localhost)
    androidScheme: "http",
    cleartext: true,
  },
};

export default config;
