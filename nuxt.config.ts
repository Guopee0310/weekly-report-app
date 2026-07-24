// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: false,

  modules: ['@pinia/nuxt'],

  app: {
    head: {
      title: '週報產生器',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png', sizes: '32x32' },
      ],
      meta: [
        { name: 'description', content: '週報產生器,周全你的好脾氣。' },
        { property: 'og:title', content: '週報產生器' },
        { property: 'og:description', content: '週報產生器,周全你的好脾氣。' },
        { property: 'og:image', content: 'https://weekly-report-app-kappa.vercel.app/og-image.png' },
        { property: 'og:url', content: 'https://weekly-report-app-kappa.vercel.app/' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '週報產生器' },
        { name: 'twitter:description', content: '週報產生器,周全你的好脾氣。' },
        { name: 'twitter:image', content: 'https://weekly-report-app-kappa.vercel.app/og-image.png' },
      ],
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  vite: {
    plugins: [tailwindcss()],
  },
})
