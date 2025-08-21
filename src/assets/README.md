# Assets Directory Structure

This directory contains all static assets for the Handy PC Tools application.

## Directory Structure

```
src/assets/
├── icons/          # SVG icons, favicons, and small graphics
├── images/         # Large images, backgrounds, and photos
├── fonts/          # Custom font files (woff, woff2, ttf, etc.)
└── data/           # JSON files, configuration data, and static content
```

## Usage

### In TypeScript Components

```typescript
import { AssetsService } from '@core/services/assets/assets.service';

constructor(private assetsService: AssetsService) {}

// Get asset paths
const logoPath = this.assetsService.getIconPath('logo.svg');
const backgroundPath = this.assetsService.getImagePath('background.jpg');
const fontPath = this.assetsService.getFontPath('custom-font.woff2');
const configPath = this.assetsService.getDataPath('config.json');

// Preload critical images
await this.assetsService.preloadImage(logoPath);

// Check if asset exists
const exists = await this.assetsService.assetExists(logoPath);
```

### In Templates

```html
<!-- Direct path usage -->
<img [src]="'/assets/images/logo.png'" alt="Logo">

<!-- Using service -->
<img [src]="getImagePath('logo.png')" alt="Logo">
```

### In SCSS

```scss
// Background images
.hero-section {
  background-image: url('/assets/images/hero-background.jpg');
}

// Icons
.icon-home::before {
  content: url('/assets/icons/home.svg');
}

// Custom fonts
@font-face {
  font-family: 'CustomFont';
  src: url('/assets/fonts/custom-font.woff2') format('woff2'),
       url('/assets/fonts/custom-font.woff') format('woff');
}
```

## File Naming Conventions

- Use kebab-case for file names: `my-icon.svg`, `hero-background.jpg`
- Use descriptive names: `loading-spinner.svg` instead of `spinner.svg`
- Include size in name if multiple sizes exist: `logo-32x32.png`, `logo-64x64.png`

## Optimization Guidelines

### Icons
- Use SVG format when possible for scalability
- Optimize SVGs with tools like SVGO
- Keep icon files under 10KB

### Images
- Use WebP format for modern browsers with fallbacks
- Compress images appropriately for their use case
- Consider lazy loading for large images
- Maximum recommended size: 5MB

### Fonts
- Use WOFF2 format primarily for best compression
- Include WOFF fallback for older browsers
- Subset fonts to include only needed characters
- Maximum recommended size: 2MB per font file

### Data Files
- Minify JSON files in production
- Keep data files under 1MB
- Consider splitting large datasets

## Build Process

Assets are automatically copied to the `dist` folder during build:
- Development: Assets served from `/assets/`
- Production: Assets bundled and served from `/assets/`

All assets in this directory are included in the production build and can be referenced using absolute paths starting with `/assets/`.

## Critical Assets

Assets marked as critical in `assets.config.ts` are preloaded for better performance:
- Logo images
- Favicon
- Essential icons
- Critical background images

## Caching

Assets are configured for optimal caching:
- Static assets: Long-term caching (30 days)
- Development: No caching for hot reload
- Production: Filename hashing for cache busting
