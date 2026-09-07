import { existsSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const sourceAssetsRoot = resolve(projectRoot, 'assets')
const optimizedAssetsRoot = resolve(projectRoot, 'assets-optimized')
const optimizableExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.bmp', '.tiff', '.tif'])

/**
 * Keeps current Phaser/Vite imports unchanged while preferring a generated WebP
 * asset when the optimizer has produced a smaller equivalent. Missing generated
 * files deliberately resolve through Vite's normal source-asset behavior.
 */
function optimizedAssetResolver(): Plugin {
  return {
    name: 'optimized-asset-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      const extension = extname(source).toLowerCase()
      if (!importer || !source.startsWith('.') || !optimizableExtensions.has(extension)) {
        return null
      }

      const sourceAsset = resolve(dirname(importer), source)
      const assetRelativePath = relative(sourceAssetsRoot, sourceAsset)
      if (isAbsolute(assetRelativePath) || assetRelativePath === '..' || assetRelativePath.startsWith(`..${sep}`)) {
        return null
      }

      const optimizedAsset = resolve(
        optimizedAssetsRoot,
        `${assetRelativePath.slice(0, -extension.length)}.webp`,
      )
      return existsSync(optimizedAsset) ? optimizedAsset : null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [optimizedAssetResolver(), react()],
})
