// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({

  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'quiet-sheep-punch.loca.lt' // 👈 add your tunnel host here
    ]
  },
  plugins: [
    react(),       // React support (JSX/TSX, Fast Refresh)
    tailwindcss(), // Tailwind support
  ],
})
