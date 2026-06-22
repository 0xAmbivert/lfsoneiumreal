import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so assets resolve correctly on IPFS / Web3 domains (served from a content hash, not a root domain)
  base: './',
  plugins: [react()],
})
