// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  ssr: false,

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

    "/console/apis/*/**": { appMiddleware: ["admin"] },
  },

  runtimeConfig: {
    PB_SUPER_ADMIN_KEY: process.env.PB_SUPER_ADMIN_KEY,
    pocketbaseUrl: process.env.PB_INTERNAL_URL || 'http://pb:8080', // server-side URL
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    public: {
      appUrl: process.env.APP_URL,
      pocketbaseUrl: process.env.PB_URL || 'http://localhost:8080', // client-side URL
    }
  }
})