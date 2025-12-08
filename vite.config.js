import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Base path for GitHub Pages
    base: '/kathrin-coaching/',

    // Build configuration
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false, // Keep console for debugging
                drop_debugger: true
            }
        },
        rollupOptions: {
            input: {
                // Main CMS bundle
                main: resolve(__dirname, 'src/index.js'),
            },
            output: {
                entryFileNames: 'js/[name].[hash].js',
                chunkFileNames: 'js/[name].[hash].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith('.css')) {
                        return 'css/[name].[hash][extname]';
                    }
                    return 'assets/[name].[hash][extname]';
                }
            }
        },
        // Generate a manifest for cache busting
        manifest: true
    },

    // Development server
    server: {
        port: 3000,
        open: true,
        cors: true
    },

    // Preview server (for testing builds)
    preview: {
        port: 4173
    },

    // Resolve aliases for cleaner imports
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@modules': resolve(__dirname, 'src/modules'),
            '@ui': resolve(__dirname, 'src/modules/ui')
        }
    },

    // Define global constants
    define: {
        __APP_VERSION__: JSON.stringify('2.0.0'),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
});
