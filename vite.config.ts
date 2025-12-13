
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    publicDir: 'public',
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: true
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // رفع حد التحذير إلى 1000 كيلوبايت لتجنب الإزعاج
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // تقسيم الكود يدوياً لفصل المكتبات الكبيرة
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react', 'recharts'],
            'core-vendor': [
              '@supabase/supabase-js', 
              '@google/genai', 
              '@capacitor/core', 
              '@capacitor/filesystem', 
              '@capacitor/share',
              '@emailjs/browser'
            ]
          }
        }
      }
    }
  };
});
