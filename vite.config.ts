import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Explicitly stringify the environment variables to ensure they are replaced at build time
      // Check both API_KEY and VITE_API_KEY to be helpful
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || process.env.SUPABASE_URL || ''),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || process.env.SUPABASE_KEY || ''),
      // Fallback for other process.env usage
      'process.env': JSON.stringify({})
    }
  }
})