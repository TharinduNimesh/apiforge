<template>
  <div class="shiki-highlight rounded-lg overflow-hidden">
    <div ref="codeRef" class="p-4" v-html="highlightedCode" />
  </div>
</template>

<script setup lang="ts">
import { codeToHtml } from 'shiki';
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  code: string;
  lang?: string;
  theme?: string;
}>();

const highlightedCode = ref('');

async function highlight() {
  try {
    highlightedCode.value = await codeToHtml(props.code, {
      lang: props.lang || 'json',
      theme: props.theme || 'one-light'
    });
  } catch (error) {
    console.error('Failed to highlight code:', error);
    // Fallback to plain text
    highlightedCode.value = `<pre>${props.code}</pre>`;
  }
}

onMounted(() => {
  highlight();
});

watch(() => props.code, () => {
  highlight();
});
</script>

<style>
.shiki-highlight {
  background-color: rgb(249 250 251 / 0.5);
  backdrop-filter: blur(4px);
}

.shiki-highlight pre {
  margin: 0;
  padding: 0;
}

.shiki {
  background: transparent !important;
}
</style>