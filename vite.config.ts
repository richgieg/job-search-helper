import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import appMetadata from './src/app/app-metadata.json'

const appNameHtmlPlugin = () => ({
  name: 'app-name-html-transform',
  transformIndexHtml(html: string) {
    return html.replace(/%APP_NAME%/g, appMetadata.appName)
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), appNameHtmlPlugin()],
})
