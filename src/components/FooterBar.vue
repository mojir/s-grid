<script setup lang="ts">
import { cssUtils } from '@/utils'

const { h } = cssUtils
</script>

<template>
  <div
    :style="h(30)"
    class="bg-slate-800 box-border border-t border-slate-700"
  ></div>
</template>
