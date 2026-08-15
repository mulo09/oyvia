import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../services/seo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    // Unknown URLs used to redirect to the home page, which made every typo a
    // soft 404 indexable as a duplicate of the home page.
    this.seo.setPageMeta({
      title: 'Página no encontrada',
      description: 'La página que buscas no existe o ha cambiado de dirección.',
      noindex: true,
    });
  }
}
