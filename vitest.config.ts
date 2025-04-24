import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    coverage: {
      provider: 'v8',
    },
  },
  // resolve: {
  //   alias: {
  //     '@mojir/pretty-pi': '../pretty-pi',
  //   },
  // },
})
