import { Component, inject } from '@angular/core';
import { BookmarkWidget } from '../../components/bookmark-widget/bookmark-widget';
import { MatRippleModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { AssetsService } from '@app/core/assets';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  imports: [MatRippleModule, RouterLink, BookmarkWidget],
  styleUrl: './home.scss',
})
export class Home {
  public readonly assetService = inject(AssetsService);

  getCurrentTime(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  }
}
