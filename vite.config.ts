import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages project site: https://<user>.github.io/bigtwo-cal/
export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS ? '/bigtwo-cal/' : '/',
})
