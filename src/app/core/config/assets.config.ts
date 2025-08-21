/**
 * Assets Configuration
 * Central configuration for all asset paths and management
 */

export const ASSETS_CONFIG = {
  // Base paths
  BASE_PATH: '/assets',
  ICONS_PATH: '/assets/icons',
  IMAGES_PATH: '/assets/images',
  FONTS_PATH: '/assets/fonts',
  DATA_PATH: '/assets/data',

  // Default assets
  DEFAULT_FAVICON: '/assets/icons/favicon.ico',
  DEFAULT_LOGO: '/assets/icons/logo.svg',
  DEFAULT_AVATAR: '/assets/images/default-avatar.png',

  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
  SUPPORTED_ICON_TYPES: ['.svg', '.ico', '.png'],
  SUPPORTED_FONT_TYPES: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
  SUPPORTED_DATA_TYPES: ['.json', '.xml', '.csv', '.txt'],

  // Cache settings
  CACHE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  PRELOAD_CRITICAL_ASSETS: true,

  // File size limits (in bytes)
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FONT_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_DATA_SIZE: 1 * 1024 * 1024, // 1MB
} as const;

/**
 * Critical assets that should be preloaded
 */
export const CRITICAL_ASSETS = [
  '/assets/icons/logo.svg',
  '/assets/icons/favicon.ico',
] as const;

/**
 * Asset categories for organization
 */
export enum AssetCategory {
  ICONS = 'icons',
  IMAGES = 'images',
  FONTS = 'fonts',
  DATA = 'data',
}

/**
 * Asset file extension mappings
 */
export const ASSET_EXTENSIONS = {
  [AssetCategory.ICONS]: ['.svg', '.ico', '.png'],
  [AssetCategory.IMAGES]: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
  [AssetCategory.FONTS]: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
  [AssetCategory.DATA]: ['.json', '.xml', '.csv', '.txt'],
} as const;
