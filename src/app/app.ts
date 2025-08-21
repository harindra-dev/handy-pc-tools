import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './components/navigation/navigation';
import { AppUtils } from './core/services/app-utils/app-utils';
import { SoundService } from './core/services/sound/sound.service';

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
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Check if the clicked element is a button or is inside a button
      const buttonElement = target.closest('button');
      if (buttonElement && !buttonElement.hasAttribute('no-click-sound')) {
        this.soundService.playClickSound(0.5);
        return; // Exit early to avoid duplicate sound
      }

      // Check for other clickable elements like links, inputs, selects
      const clickableElement = target.closest(
        'a, input[type="button"], input[type="submit"], input[type="reset"], select, [role="button"]'
      );
      if (
        clickableElement &&
        !clickableElement.hasAttribute('no-click-sound')
      ) {
        this.soundService.playClickSound(0.5);
        return; // Exit early to avoid duplicate sound
      }

      // Check if element has clickSound directive
      if (target.hasAttribute('clickSound') || target.closest('[clickSound]')) {
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
    });
  }
}
