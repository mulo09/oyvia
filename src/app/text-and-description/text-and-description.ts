import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-text-and-description',
  imports: [],
  templateUrl: './text-and-description.html',
  styleUrl: './text-and-description.scss',
})
export class TextAndDescription {
  @Input() title: string = 'Noticias de Surf y Kite';
  @Input() description: string = 'Mantente al día con las últimas noticias, consejos e historias del mundo del surf y el kitesurf.';
}
