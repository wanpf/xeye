import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig(() => {
    return {
				server: {
					proxy: {
						'/client': {
							target: 'http://127.0.0.1:6060/',
							changeOrigin: true,
							rewrite: (path) => path.replace(/^\/client/, ''),
						},
						'/server': {
							target: 'http://127.0.0.1:8001/',
							changeOrigin: true,
							rewrite: (path) => path.replace(/^\/server/, ''),
						},
					}
				},
        plugins: [vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        }
    };
});
