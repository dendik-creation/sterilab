import { defineConfig, mergeConfig, type Plugin } from 'vite'
import baseConfig from './vite.config'

/**
 * Chromium rejects `<script type="module" src>` and `crossorigin` fetches on
 * `file://` (opaque "null" origin). The offline bundle is therefore one classic
 * IIFE script, referenced with a plain deferred `<script src>`.
 */
function classicScriptHtml(): Plugin {
  return {
    name: 'offline-classic-script-html',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin /g, '<script defer ')
        .replace(/<script type="module" /g, '<script defer ')
        .replace(/ crossorigin(?:="[^"]*")?/g, '')
    },
  }
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    base: './',
    plugins: [classicScriptHtml()],
    // Rolldown already turns `import.meta` into `{}` for IIFE; say so explicitly to silence EMPTY_IMPORT_META.
    define: { __OFFLINE_BUILD__: true, 'import.meta': '{}' },
    experimental: {
      // Default `base: './'` output in an IIFE resolves JS asset URLs against
      // `document.currentScript`, which is null once the script has finished
      // (lazily-initialised modules run later), falling back to the page URL
      // and dropping the `assets/` folder. index.html sits at the dist root,
      // so resolve the root-relative filename against the document instead.
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { runtime: `new URL(${JSON.stringify(filename)}, document.baseURI).href` }
        }
      },
    },
    build: {
      outDir: 'dist-offline',
      emptyOutDir: true,
      modulePreload: false,
      cssCodeSplit: false,
      rollupOptions: {
        output: { format: 'iife', inlineDynamicImports: true },
      },
    },
  }),
)
