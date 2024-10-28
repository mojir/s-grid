// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxt/test-utils',
    '@nuxt/eslint',
  ],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  eslint: {
    config: {
      stylistic: true, // <---
    },
  },
})
