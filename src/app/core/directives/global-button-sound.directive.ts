import { Directive, HostListener } from '@angular/core';
import { SoundService } from '../services/sound/sound.service';

@Directive({
  selector: 'button:not([no-click-sound])',
  standalone: true,
})
export class GlobalButtonSoundDirective {
  constructor(private readonly soundService: SoundService) {}

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    this.soundService.playClickSound(0.3);
  }
}
