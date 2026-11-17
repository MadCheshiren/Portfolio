import { createWhistle } from 'cactus-needle/browser';
import workerUrl from 'cactus-needle/browser/worker.js?url';
import wasmUrl from 'cactus-needle/browser/needle.wasm?url';

export const PORTFOLIO_KEYWORDS = [
  'Kirren',
  'PayDaily',
  'SQLite',
  'TESDA',
  'Oracle',
  'Three.js',
  'Stray Cat',
  'Voicemail',
  'Systems',
];

let whistlePromise = null;
let whistleInstance = null;

/**
 * Lazily initializes and caches the 16.9 MB Whistle WASM speech model in a module worker.
 * Model bytes download from Hugging Face only on explicit user opt-in and persist in CacheStorage.
 */
export async function ensureWhistleSession({ onProgress, signal } = {}) {
  if (whistleInstance) {
    onProgress?.({ loaded: 16_919_407, total: 16_919_407, percentage: 100 });
    return whistleInstance;
  }

  if (whistlePromise) {
    return whistlePromise;
  }

  whistlePromise = createWhistle({
    workerUrl,
    wasmUrl,
    cache: true,
    onDownloadProgress: (progress) => {
      onProgress?.(progress);
    },
    abortSignal: signal,
  })
    .then((session) => {
      whistleInstance = session;
      return session;
    })
    .catch((err) => {
      whistlePromise = null;
      throw err;
    });

  return whistlePromise;
}

/**
 * Runs local browser transcription on captured mono PCM samples using Whistle.
 */
export async function transcribeWithWhistle({
  samples,
  sampleRate,
  language,
  useKeywordBias = true,
  onProgress,
  signal,
}) {
  const session = await ensureWhistleSession({ onProgress, signal });

  const options = {
    wordTimestamps: true,
    abortSignal: signal,
  };

  if (language && language !== 'auto') {
    options.language = language;
  }

  if (useKeywordBias) {
    options.keywords = PORTFOLIO_KEYWORDS;
  }

  return session.transcribe({ samples, sampleRate }, options);
}

/**
 * Terminates the resident Whistle worker and frees WASM memory.
 */
export async function closeWhistleSession() {
  const current = whistleInstance;
  whistleInstance = null;
  whistlePromise = null;
  if (current) {
    await current.close().catch(() => {});
  }
}
