import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[clickSound]',
  standalone: true,
})
export class ClickSoundDirective {
  @Input() clickSoundVolume: number = 0.3;
  @Input() clickSoundEnabled: boolean = true;

  // This directive only provides data attributes for the global listener
  // The actual click handling is done in the app.ts global listener
}
