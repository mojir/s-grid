// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxt/test-utils',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
  ],
  devtools: { enabled: true },
  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },
  compatibilityDate: '2024-04-03',
  eslint: {
    config: {
      stylistic: true, // <---
    },
  },
})
