<script setup lang="ts">
</script>

<template>
  <div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
    >
      <!-- Rounded Rectangle Background -->
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="6"
        class="logo-background"
      />

      <!-- Square Grid Pattern - 2x2 with adjusted position -->
      <g transform="translate(16 16) scale(0.7) translate(-16 -16)">
        <path
          d="M8 8 L24 8 L24 24 L8 24 Z
             M8 16 L24 16
             M16 8 L16 24"
          class="logo-grid"
          stroke-width="1.4"
          fill="none"
          stroke-linejoin="miter"
        />
      </g>

      <!-- Lisp Parentheses - Adjusted for rectangular shape -->
      <path
        d="M7 8.5 Q5 16 7 23.5"
        class="logo-parens"
        stroke-width="2.2"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M25 8.5 Q27 16 25 23.5"
        class="logo-parens"
        stroke-width="2.2"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.logo-background {
  fill: var(--logo-fill-color);
}
.logo-grid {
  stroke: var(--logo-grid-color);
}
.logo-parens {
  stroke: var(--logo-parens-color);
}
</style>
