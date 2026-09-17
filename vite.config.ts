import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: mode === "development" ? "http://localhost:3001/" : "/mfe/seller-product/",
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: "grab_seller_product",
        filename: "remoteEntry.js",
        manifest: true,
        dts: process.env.MF_DTS === "0" ? false : {
          generateTypes: {
            tsConfigPath: "./tsconfig.app.json",
            abortOnError: true,
          },
        },
        exposes: { "./Routes": "./src/app/AppRoutes.tsx" },
        shared: {
          "react": { singleton: true, requiredVersion: "19.2.4" },
          "react-dom": { singleton: true, requiredVersion: "19.2.4" },
          "react-router": { singleton: true, requiredVersion: "7.18.0" },
          "react-hook-form": { singleton: true, requiredVersion: "7.74.0" },
          "@tanstack/react-query": { singleton: true, requiredVersion: "5.99.2" },
          "@khinemyaezin/seller-api": { singleton: true },
          "@khinemyaezin/seller-ui": { singleton: true },
          "@khinemyaezin/seller-contracts": { singleton: true },
        },
      }),
    ],
    server: {
      port: 3001,
      origin: env.VITE_ORIGIN,
      cors: { origin: env.VITE_CORS_ORIGIN },
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          xfwd: true,
          timeout: 0,
          proxyTimeout: 0,
        },
      },
    },
    preview: { port: 3001 },
    build: {
      target: 'chrome111',
      minify: false,
      cssCodeSplit: false,
    },
  };
});
