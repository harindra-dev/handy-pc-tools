import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './components/navigation/navigation';
import { AppUtils } from './core/services/app-utils/app-utils';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  protected readonly title = signal('handy-pc-tools');
  private readonly appUtilsService = inject(AppUtils);
  constructor() {
    this.appUtilsService.fetchMonacoLoader().subscribe();
  }
}
