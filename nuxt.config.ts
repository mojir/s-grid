// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/test-utils',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    'shadcn-nuxt',
    '@nuxthub/core',
    '@nuxtjs/device',
  ],
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'S-Grid',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },
  compatibilityDate: '2024-04-03',
  hub: {
    // NuxtHub options
  },
  eslint: {
    config: {
      stylistic: true, // <---
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui',
  },
})
