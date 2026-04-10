/**
 * True only in an Electron renderer where `process.versions.electron` is set.
 * Avoids false positives from `process.type` polyfills or UA substrings in embedded browsers.
 */
export function isElectronApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const versions = (window as Window & { process?: { versions?: { electron?: string } } })
    .process?.versions;
  return typeof versions?.electron === 'string' && versions.electron.length > 0;
}
