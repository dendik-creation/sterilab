import { applicationAssetUrls } from 'virtual:application-assets';

export interface AssetLoadProgress {
  completed: number;
  total: number;
  percent: number;
}

const APPLICATION_ASSET_URLS = [...new Set(applicationAssetUrls)];
const AUDIO_EXTENSION = /\.(?:ogg|mp3|wav|webm)(?:\?|$)/i;

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => resolve();

    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
    image.src = url;
  });
}

function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const finish = () => {
      resolve();
    };

    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audio.src = url;
    audio.load();
  });
}

function preloadAsset(url: string): Promise<void> {
  return AUDIO_EXTENSION.test(url) ? preloadAudio(url) : preloadImage(url);
}

let applicationAssetsPromise: Promise<void> | undefined;
let currentProgress: AssetLoadProgress = { completed: 0, total: APPLICATION_ASSET_URLS.length, percent: 0 };
const progressListeners = new Set<(progress: AssetLoadProgress) => void>();

function publishProgress(progress: AssetLoadProgress): void {
  currentProgress = progress;
  for (const listener of progressListeners) listener(progress);
}

/**
 * Downloads and decodes every application media asset. Progress is based on
 * completed browser loads, rather than a timer, so a cached asset and a slow
 * network asset both affect the splash bar truthfully.
 */
export function preloadApplicationAssets(onProgress: (progress: AssetLoadProgress) => void): Promise<void> {
  // React Strict Mode remounts effects in development. Subscribing each caller
  // lets the remounted splash continue from the in-flight shared load instead
  // of being stuck at the initial 0% after the first effect is cleaned up.
  onProgress(currentProgress);
  progressListeners.add(onProgress);
  if (applicationAssetsPromise) {
    return applicationAssetsPromise.finally(() => progressListeners.delete(onProgress));
  }

  const total = APPLICATION_ASSET_URLS.length;
  let completed = 0;
  publishProgress({ completed, total, percent: 0 });

  applicationAssetsPromise = Promise.all(
    APPLICATION_ASSET_URLS.map((url) =>
      preloadAsset(url).finally(() => {
        completed += 1;
        publishProgress({ completed, total, percent: Math.round((completed / total) * 100) });
      }),
    ),
  ).then(() => undefined);

  return applicationAssetsPromise.finally(() => progressListeners.delete(onProgress));
}
