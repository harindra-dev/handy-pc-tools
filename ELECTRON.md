# Handy PC Tools - Desktop App

This is the desktop version of Handy PC Tools built with Electron.

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Setup

```bash
npm install
```

### Development Workflow

1. **Start the Angular development server:**

```bash
npm start
```

2. **In another terminal, start Electron:**

```bash
npm run electron
```

3. **Or run both together:**

```bash
npm run electron:dev
```

### Building for Production

#### Build for current platform:

```bash
npm run electron:build
```

#### Build for specific platforms:

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

#### Build for all platforms:

```bash
npm run dist
```

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Offline-first**: All tools work without internet connection
- **Native menus**: Platform-specific menu bars
- **Security**: Sandboxed web content with secure defaults
- **Auto-updater ready**: Prepared for future update mechanisms

## Application Structure

- `electron.js` - Main Electron process
- `src/` - Angular application source
- `dist/` - Built Angular application
- `dist-electron/` - Electron distribution files
- `build/` - Application icons and assets

## Icon Requirements

For proper distribution, replace the placeholder icons in the `build/` directory:

- `icon.ico` - Windows icon (256x256 recommended)
- `icon.icns` - macOS icon (512x512 recommended)
- `icon.png` - Linux icon (512x512 recommended)

## Distribution Notes

- Windows: Creates NSIS installer and ZIP archive
- macOS: Creates DMG and ZIP archive with universal binaries (Intel + Apple Silicon)
- Linux: Creates AppImage and DEB packages

## Security

The Electron app follows security best practices:

- Context isolation enabled
- Node integration disabled
- Remote module disabled
- Secure external link handling
- Navigation restrictions
