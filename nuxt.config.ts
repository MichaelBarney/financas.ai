// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    ssr: false,
    modules: [
        '@nuxt/icon',
    ],
    extends: [
        ['github:meistrari/tela/packages/build#build-fixes', { auth: process.env.GITHUB_PAT, install: true }],
    ],
    // Configuration to resolve middleware conflicts
    nitro: {
        experimental: {
            wasm: true,
        },
    },
    // Add explicit middleware override
    hooks: {
        'nitro:build:before': (nitro) => {
            // Force override of conflicting middleware
            if (nitro.options.handlers) {
                nitro.options.handlers = nitro.options.handlers.filter(
                    handler => !(handler.middleware && handler.route === '/**'),
                )
            }
        },
    },
    runtimeConfig: {
        // Private keys (only available on server-side)
        telaApiKey: process.env.TELA_API_KEY,

        // Public keys (exposed to client-side)
        public: {
            telaApiKey: process.env.TELA_API_KEY,
        },
    },
})
