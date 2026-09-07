import { existsSync, readdirSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const sourceAssetsRoot = resolve(projectRoot, 'assets')
const optimizedAssetsRoot = resolve(projectRoot, 'assets-optimized')
const optimizableExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.bmp', '.tiff', '.tif'])
const preloadableExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ogg', '.mp3', '.wav', '.webm'])
const applicationAssetsModuleId = 'virtual:application-assets'
const resolvedApplicationAssetsModuleId = `\0${applicationAssetsModuleId}`

function findFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? findFiles(path) : [path]
  })
}

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

/**
 * Provides the splash loader with one URL for every runtime media file. Image
 * entries select their generated WebP when present, matching regular asset
 * imports, and otherwise retain the original file as a safe fallback.
 */
function applicationAssetManifest(): Plugin {
  return {
    name: 'application-asset-manifest',
    resolveId(source) {
      return source === applicationAssetsModuleId ? resolvedApplicationAssetsModuleId : null
    },
    load(id) {
      if (id !== resolvedApplicationAssetsModuleId) return null

      const assetFiles = findFiles(sourceAssetsRoot)
        .filter((asset) => preloadableExtensions.has(extname(asset).toLowerCase()))
        .map((asset) => {
          const extension = extname(asset)
          if (!optimizableExtensions.has(extension.toLowerCase())) return asset

          const relativePath = relative(sourceAssetsRoot, asset)
          const optimizedAsset = resolve(optimizedAssetsRoot, `${relativePath.slice(0, -extension.length)}.webp`)
          return existsSync(optimizedAsset) ? optimizedAsset : asset
        })
        .sort()

      const imports = assetFiles.map((asset, index) => `import asset${index} from ${JSON.stringify(`${asset}?url`)};`).join('\n')
      const urls = assetFiles.map((_, index) => `asset${index}`).join(', ')
      return `${imports}\nexport const applicationAssetUrls = [${urls}];\n`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [applicationAssetManifest(), optimizedAssetResolver(), react()],
})
