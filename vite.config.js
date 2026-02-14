import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Finance',
        short_name: 'Finance',
        description: 'Gerenciador financeiro pessoal',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#111827',
        theme_color: '#111827',
        lang: 'pt-BR',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        // Não interceptar requisições de autenticação e segurança
        navigateFallbackDenylist: [/^\/__/, /\/api\//],
        runtimeCaching: [
          // reCAPTCHA Enterprise — NUNCA cachear
          {
            urlPattern: /^https:\/\/recaptcha\.net\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/www\.google\.com\/recaptcha\/.*/i,
            handler: 'NetworkOnly'
          },
          // Firebase Auth — NUNCA cachear
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          // Firebase App Check — NUNCA cachear
          {
            urlPattern: /^https:\/\/content-firebaseappcheck\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          // Firebase Auth iframe/handler
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/__\/auth\/.*/i,
            handler: 'NetworkOnly'
          },
          // Firestore — tenta rede primeiro, fallback cache
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300 // 5 minutos
              }
            }
          },
          // Google Fonts / CDN assets — cache first
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              }
            }
          }
        ]
      }
    })
  ],
})
