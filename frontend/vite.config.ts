import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackStartVite } from "@tanstack/start-vite-plugin";

export default defineConfig({
  plugins: [
    TanStackStartVite({
      server: { entry: "server" },
    }),
    react(),
    tsconfigPaths()
  ],
  server: {
    port: 3222,
    strictPort: true,
    host: true,
  },
});
