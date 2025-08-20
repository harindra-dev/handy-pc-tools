import { Component } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { BookmarkWidget } from '../../components/bookmark-widget/bookmark-widget';

@Component({
  selector: 'app-home',
  imports: [MatRippleModule, RouterLink, BookmarkWidget],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
