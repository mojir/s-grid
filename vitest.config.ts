import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
    coverage: {
      provider: 'v8',
    },
  },
})
