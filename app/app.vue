<script setup lang="ts">
useHead({
  title: 'Donkey Kong',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
    { name: 'description', content: 'A browser recreation of the 1981 Donkey Kong arcade game with original and modern graphics.' },
  ],
  bodyAttrs: { style: 'margin:0;background:#05060c' },
})
</script>

<template>
  <ClientOnly>
    <DonkeyKongGame />
    <template #fallback>
      <div style="min-height:100vh;display:grid;place-items:center;background:#05060c;color:#cfd3e0;font-family:system-ui">
        Loading Donkey Kong…
      </div>
    </template>
  </ClientOnly>
</template>
