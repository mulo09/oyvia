import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Articlegrid } from '../articlegrid/articlegrid';

@Component({
  selector: 'app-home',
  imports: [Articlegrid, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  constructor(private router: Router) {}

  goToCalendar(): void {
    this.router.navigate(['/surf-calendar']);
  }

  scrollToArticles(): void {
    document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' });
  }
}
