import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // A aplicação é usada em telas interativas de sala de aula, onde a rede
    // costuma cair. O service worker guarda a aplicação e o worker do pdf.js,
    // então abrir o app e importar um PDF continuam funcionando offline.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Max - Jogos Interativos',
        short_name: 'Max Jogos',
        description: 'Plataforma educacional gamificada para instrutores e turmas técnicas',
        theme_color: '#06060f',
        background_color: '#06060f',
        display: 'fullscreen',
        orientation: 'landscape',
        lang: 'pt-BR',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // O worker do pdf.js tem ~2 MB e precisa entrar no precache para a
        // importação funcionar sem rede.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,woff2}'],
        // O Firestore tem cache próprio; deixar o SW interceptar atrapalha.
        navigateFallbackDenylist: [/^\/__/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'fontes', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
})
