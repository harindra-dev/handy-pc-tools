import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './components/navigation/navigation';
import { AppUtils } from './core/services/app-utils/app-utils';
import { SoundService } from './core/services/sound/sound.service';

// For passive event listener support
interface AddEventListenerOptions extends EventListenerOptions {
  passive?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  protected readonly title = signal('handy-pc-tools');
  private readonly appUtilsService = inject(AppUtils);
  private readonly soundService = inject(SoundService);

  constructor() {
    this.appUtilsService.fetchMonacoLoader().subscribe();
  }

  ngOnInit(): void {
    // Preload UI sounds for better performance
    this.soundService.preloadUISounds();

    // Add global button click listener
    this.setupGlobalButtonClickListener();
  }

  private setupGlobalButtonClickListener(): void {
    // Use a single passive event listener for better performance
    document.addEventListener(
      'click',
      (event) => {
        // Skip processing if sound is disabled
        if (!this.soundService.isSoundEnabled()) return;

        const target = event.target as HTMLElement;

        // Consolidated selector for all clickable elements
        const clickableElement = target.closest(
          'button, a, input[type="button"], input[type="submit"], input[type="reset"], .clickable, [role="button"]'
        );

        // Handle standard clickable elements
        if (
          clickableElement &&
          !clickableElement.hasAttribute('no-click-sound')
        ) {
          // Use volume attribute if specified
          const volumeAttr =
            clickableElement.getAttribute('click-sound-volume');
          const volume = volumeAttr ? parseFloat(volumeAttr) : 0.5;

          // Play sound with throttling (implemented in SoundService)
          this.soundService.playClickSound(volume);
          return; // Exit early to avoid duplicate sound
        }

        // Check if element has clickSound directive
        if (
          target.hasAttribute('clickSound') ||
          target.closest('[clickSound]')
        ) {
          // Get custom volume if specified
          const clickSoundElement = target.hasAttribute('clickSound')
            ? target
            : (target.closest('[clickSound]') as HTMLElement);
          const volume = clickSoundElement?.getAttribute('clickSoundVolume');
          const enabled = clickSoundElement?.getAttribute('clickSoundEnabled');

          if (enabled !== 'false') {
            this.soundService.playClickSound(volume ? parseFloat(volume) : 0.5);
          }
        }
      },
      { passive: true } as AddEventListenerOptions
    );
  }
}
