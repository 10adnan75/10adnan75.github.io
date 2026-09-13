import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "three-core": ["three"],
          "three-geometry": ["three/addons/geometries/RoundedBoxGeometry.js"],
          "three-css3d": ["three/addons/renderers/CSS3DRenderer.js"],
        },
      },
    },
  },
});
