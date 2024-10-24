// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/data': 'http://api:8080',
		}, 
  },
});
