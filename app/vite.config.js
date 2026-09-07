import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
export default defineConfig({
    plugins: [solid()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules/katex'))
                        return 'katex';
                    if (id.includes('/data/nobel-prizes.json'))
                        return 'data-nobel';
                    if (id.includes('/data/tier1-awards-laureates.json'))
                        return 'data-tier1';
                    if (id.includes('/schema/research-awards.json'))
                        return 'data-awards';
                },
            },
        },
    },
});
