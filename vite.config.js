import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // React plugin (Babel is configured internally by the plugin)
    react({
      // If you need custom Babel plugins, list them as strings or
      // [plugin, options] arrays. Do not pass Vite plugins here.
      // babel: {
      //   plugins: ['babel-plugin-react-compiler'],
      // },
    }),

    // Tailwind Vite plugin belongs at the top-level plugins array
    tailwindcss(),
  ],
})
