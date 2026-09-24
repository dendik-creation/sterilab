declare module 'virtual:application-assets' {
  export const applicationAssetUrls: string[]
}

/** true only in `npm run build:offline` (file:// distribution). */
declare const __OFFLINE_BUILD__: boolean;
