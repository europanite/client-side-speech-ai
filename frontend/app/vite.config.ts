import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/client-side-speech-ai/",

  plugins: [react()],

  worker: { format: "es" },

  build: {
    target: "es2022",
    sourcemap: true
  },

  optimizeDeps: {
    // transformers.js is too heavy to import first
    exclude: ["@huggingface/transformers", "pocket-tts-js"]
  }
});
