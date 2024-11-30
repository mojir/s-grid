import type { GridDTO } from '~/dto/GridDTO'

const testFixturesRef = ref<GridDTO[]>()

export function useTestFixtures() {
  if (!testFixturesRef.value) {
    import('../tests/integration/fixtures').then(({ default: testFixtures }) => {
      testFixturesRef.value = testFixtures
    })
  }

  return testFixturesRef
}
