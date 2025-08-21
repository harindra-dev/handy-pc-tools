// Custom TypeScript declaration for Electron's `require` in the renderer process

interface Window {
  require: NodeRequire;
}
