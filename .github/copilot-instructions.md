- don't use @apply directive with utility classes
- frontend application code lives inside the app folder.
- in nuxt ui now UFormGroup has changed to UFormField
- keep component and pages in nicely structured way.
- nuxt ui new colors - color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral" | undefined
- nuxt ui UModal usage as been changed. we don't need to use two way data binding with v-model to open and close Modal. we have to add button inside the UModal component and, content inside a content slot. we have used it in our project in AddEndpointModal like component. also here's an example:
```
<template>
  <UModal>
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #content>
      <Placeholder class="h-48 m-4" />
    </template>
  </UModal>
</template>
```

- to customize modal openning and closing, we can use v-model:open prop on UModal component.