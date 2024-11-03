<script setup lang="ts">
</script>

<template>
  <div
    class="gap-3 py-2 px-3 flex flex-wrap items-center dark:bg-slate-900 bg-gray-100 dark:text-slate-300 text-gray-700 box-border rounded-3xl"
  >
    <div class="flex gap-1">
      <ToolbarFontSizeSelector />
      <ToolbarBoldButton />
      <ToolbarItalicButton />
      <ToolbarTextDecorationSwitch />
    </div>
    <ToolbarJustifySwitch />
    <ToolbarAlignSwitch />
  </div>
</template>
