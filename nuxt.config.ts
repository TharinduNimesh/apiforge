// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],

  colorMode: {
    preference: 'light',
  },

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4
  },

  routeRules: {
    "/console": { ssr: false, appMiddleware: "auth" },
    "/console/*/**": { ssr: false, appMiddleware: "auth" },
    
    "/console/users": { appMiddleware: ["admin"] },
    "/console/users/*/**": { appMiddleware: ["admin"] },

    "/console/departments": { appMiddleware: ["admin"] },
    "/console/departments/*/**": { appMiddleware: ["admin"] },

    "/console/apis/create": { appMiddleware: ["admin"] },
  },

  runtimeConfig: {
    PB_SUPER_ADMIN_KEY: process.env.PB_SUPER_ADMIN_KEY,
  }
})