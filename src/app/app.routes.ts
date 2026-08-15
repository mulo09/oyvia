import { Routes } from '@angular/router';
import { Home } from './home/home';
import { SurfCalendar } from './surf-calendar/surf-calendar';
import { ArticleDetail } from './article-detail/article-detail';
import { AboutUs } from './about-us/about-us';
import { Contact } from './contact/contact';
import { NotFound } from './not-found/not-found';
import { PageMeta } from './services/seo';

export interface RouteSeoData {
  /** Metadata applied on navigation. Omitted when the component sets it itself. */
  seo?: PageMeta;
}

export const routes: Routes = [
  {
    path: '',
    component: Home,
    data: {
      seo: {
        description:
          'Noticias, reportajes y calendario de competiciones de surf y kitesurf. ' +
          'Actualidad de las olas, el viento y la cultura surf desde Barcelona.',
        url: '/',
      },
    },
  },
  {
    path: 'home',
    component: Home,
    data: {
      seo: {
        description:
          'Noticias, reportajes y calendario de competiciones de surf y kitesurf. ' +
          'Actualidad de las olas, el viento y la cultura surf desde Barcelona.',
        // Canonical points at the root so /home does not compete with it.
        url: '/',
      },
    },
  },
  {
    path: 'about',
    component: AboutUs,
    data: {
      seo: {
        title: 'Sobre Nosotros',
        description:
          'Quiénes somos: una comunidad nacida entre el asfalto y la marea que comparte ' +
          'la pasión por el surf y el kitesurf desde Barcelona.',
        image: 'assets/images/About_us.jpg',
      },
    },
  },
  {
    path: 'contact',
    component: Contact,
    data: {
      seo: {
        title: 'Contacto',
        description:
          'Escríbenos para proponer temas, enviar fotos de tus sesiones o colaborar con ' +
          'Olas y Vientos. Hablemos de olas.',
      },
    },
  },
  {
    path: 'surf-calendar',
    component: SurfCalendar,
    data: {
      seo: {
        title: 'Calendario de Eventos de Surf 2026',
        description:
          'Calendario completo del WSL Championship Tour 2026 y de las principales ' +
          'competiciones de surf en España: fechas, sedes y detalles.',
        image: 'assets/images/surf1.jpg',
      },
    },
  },
  // No `seo` data: ArticleDetail sets the metadata once the article is loaded.
  { path: 'article/:id', component: ArticleDetail },
  // Unknown URLs render a real 404 page marked noindex instead of silently
  // showing the home page, which search engines treat as a soft 404.
  { path: '**', component: NotFound },
];
