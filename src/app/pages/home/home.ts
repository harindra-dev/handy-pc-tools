import { Component } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [MatRippleModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
