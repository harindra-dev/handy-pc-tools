import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssetsService {
  /**
   * Get the full path to an asset based on environment
   * @param relativePath - Relative path from assets folder (e.g., 'images/logo.png')
   * @returns Full asset path that works in both dev and production
   */
  getAssetPath(relativePath: string): string {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    // In Angular, assets are served from /assets/ in both dev and production
    return `/assets/${cleanPath}`;
  }

  /**
   * Get icon asset path
   * @param iconName - Icon filename (e.g., 'logo.svg')
   * @returns Full path to icon
   */
  getIconPath(iconName: string): string {
    return this.getAssetPath(`icons/${iconName}`);
  }

  /**
   * Get image asset path
   * @param imageName - Image filename (e.g., 'background.jpg')
   * @returns Full path to image
   */
  getImagePath(imageName: string): string {
    return this.getAssetPath(`images/${imageName}`);
  }

  /**
   * Get font asset path
   * @param fontName - Font filename (e.g., 'custom-font.woff2')
   * @returns Full path to font
   */
  getFontPath(fontName: string): string {
    return this.getAssetPath(`fonts/${fontName}`);
  }

  /**
   * Get data asset path (JSON, etc.)
   * @param dataName - Data filename (e.g., 'config.json')
   * @returns Full path to data file
   */
  getDataPath(dataName: string): string {
    return this.getAssetPath(`data/${dataName}`);
  }

  /**
   * Get audio asset path
   * @param audioName - Audio filename (e.g., 'click.mp3')
   * @returns Full path to audio file
   */
  getAudioPath(audioName: string): string {
    return this.getAssetPath(`audio/${audioName}`);
  }

  /**
   * Get audio asset path with fallback to public folder
   * @param audioName - Audio filename (e.g., 'click.mp3')
   * @returns Full path to audio file
   */
  getAudioPathWithFallback(audioName: string): string {
    // Try assets folder first, then public folder
    return this.getAssetPath(`audio/${audioName}`);
  }

  /**
   * Get public folder audio path (fallback)
   * @param audioName - Audio filename (e.g., 'click.mp3')
   * @returns Full path to audio file in public folder
   */
  getPublicAudioPath(audioName: string): string {
    return `/${audioName}`;
  }

  /**
   * Preload an image for better performance
   * @param imagePath - Path to the image
   * @returns Promise that resolves when image is loaded
   */
  preloadImage(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error(`Failed to load image: ${imagePath}`));
      img.src = imagePath;
    });
  }

  /**
   * Check if an asset exists
   * @param assetPath - Path to the asset
   * @returns Promise that resolves to boolean
   */
  async assetExists(assetPath: string): Promise<boolean> {
    try {
      const response = await fetch(assetPath, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}
