import { Injectable } from '@angular/core';
import { AssetsService } from '../assets/assets.service';

interface AddEventListenerOptions extends EventListenerOptions {
  passive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private readonly audioCache = new Map<string, HTMLAudioElement>();
  private soundEnabled = true;
  private audioInitialized = false;
  private readonly throttleTimers: Record<string, number> = {};
  private audioContext: AudioContext | null = null;

  constructor(private readonly assetsService: AssetsService) {
    // Initialize audio context on first user interaction
    this.initializeAudioOnInteraction();
  }

  /**
   * Initialize audio context on first user interaction to comply with autoplay policies
   * Using passive listeners for better performance
   */
  private initializeAudioOnInteraction(): void {
    const initAudio = () => {
      if (!this.audioInitialized) {
        // Create audio context only once
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        this.audioContext.resume().then(() => {
          this.audioInitialized = true;

          // Preload common sounds once audio is initialized
          this.preloadUISounds();
        });

        // Remove the listener after first interaction
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
        document.removeEventListener('keydown', initAudio);
      }
    };

    // Use passive event listeners for better performance
    document.addEventListener('click', initAudio, {
      passive: true,
    } as AddEventListenerOptions);
    document.addEventListener('touchstart', initAudio, {
      passive: true,
    } as AddEventListenerOptions);
    document.addEventListener('keydown', initAudio, {
      passive: true,
    } as AddEventListenerOptions);
  }

  /**
   * Enable or disable sound globally
   * @param enabled - Whether sound should be enabled
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  /**
   * Check if sound is enabled
   * @returns Whether sound is currently enabled
   */
  isSoundEnabled(): boolean {
    const stored = localStorage.getItem('soundEnabled');
    if (stored !== null) {
      this.soundEnabled = stored === 'true';
    }
    return this.soundEnabled;
  }

  /**
   * Preload an audio file for better performance
   * @param audioFileName - Audio file name (e.g., 'computer-mouse-click.mp3')
   */
  preloadAudio(audioFileName: string): void {
    if (this.audioCache.has(audioFileName)) {
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    const audioPath = this.assetsService.getAudioPath(audioFileName);
    audio.src = audioPath;

    // Handle loading errors gracefully
    audio.addEventListener('error', () => {
      // Try fallback path
      const fallbackPath = this.assetsService.getPublicAudioPath(audioFileName);
      audio.src = fallbackPath;
    });

    this.audioCache.set(audioFileName, audio);
  }
  /**
   * Play an audio file with throttling to prevent performance issues
   * @param audioFileName - Audio file name (e.g., 'computer-mouse-click.mp3')
   * @param volume - Volume level (0-1), defaults to 0.5
   */
  playSound(audioFileName: string, volume: number = 0.5): void {
    if (!this.isSoundEnabled()) {
      return;
    }

    // Use throttling for performance
    this.throttleAudio(
      audioFileName,
      () => {
        let audio = this.audioCache.get(audioFileName);

        if (!audio) {
          // Create audio on-demand if not preloaded
          const audioPath = this.assetsService.getAudioPath(audioFileName);
          audio = new Audio();
          audio.src = audioPath;

          // Set up error handler for fallback
          audio.addEventListener('error', () => {
            audio!.src = this.assetsService.getPublicAudioPath(audioFileName);
          });

          this.audioCache.set(audioFileName, audio);
        }

        // Reset and play the same audio instance for better performance
        try {
          audio.currentTime = 0;
          audio.volume = Math.max(0, Math.min(1, volume));

          // Use promise for better error handling
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Silently fail on autoplay restrictions
            });
          }
        } catch (error) {
          // Silently catch any play errors
        }
      },
      50
    ); // 50ms throttle
  }

  /**
   * Throttle audio playback to prevent performance issues
   * @param id Unique identifier for the throttle timer
   * @param callback Function to call when throttle allows
   * @param delay Throttle delay in milliseconds
   */
  private throttleAudio(id: string, callback: () => void, delay: number): void {
    if (this.throttleTimers[id]) return;

    callback();

    this.throttleTimers[id] = window.setTimeout(() => {
      delete this.throttleTimers[id];
    }, delay);
  }

  /**
   * Play the mouse click sound with throttling
   * @param volume - Volume level (0-1), defaults to 0.3
   */
  playClickSound(volume: number = 0.3): void {
    this.playSound('computer-mouse-click.mp3', volume);
  }

  /**
   * Preload common UI sounds
   */
  preloadUISounds(): void {
    this.preloadAudio('computer-mouse-click.mp3');
  }

  /**
   * Stop all currently playing sounds
   */
  stopAllSounds(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Clear the audio cache
   */
  clearCache(): void {
    this.stopAllSounds();
    this.audioCache.clear();
  }
}
