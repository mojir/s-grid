<script setup lang="ts">
import { cssUtils } from '@/utils'

const { h } = cssUtils
</script>

<template>
  <div
    :style="h(50)"
    class="flex justify-center items-center text-2xl bg-slate-800 text-slate-300"
  >
    &lambda;itsheet
  </div>
</template>
