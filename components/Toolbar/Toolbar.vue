<script setup lang="ts">
</script>

<template>
  <div
    class="gap-3 w-full h-9 p-2 flex items-center dark:bg-slate-900 bg-gray-100 dark:text-slate-300 text-gray-700 box-border rounded-md"
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
