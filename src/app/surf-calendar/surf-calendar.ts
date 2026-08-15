import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SeoService } from '../services/seo';
import { SITE, absoluteUrl } from '../site.config';

export interface SurfEvent {
  name: string;
  /** Human readable date range shown in the card. */
  dateLabel: string;
  location: string;
  /** ISO 8601 date. Month precision (YYYY-MM) for unconfirmed dates. */
  startDate: string;
  endDate?: string;
  /** Locality and country used for the schema.org Place. */
  place: { locality: string; country: string };
  confirmed: boolean;
}

const JSON_LD_ID = 'calendar-json-ld';

@Component({
  selector: 'app-surf-calendar',
  imports: [CommonModule],
  templateUrl: './surf-calendar.html',
  styleUrl: './surf-calendar.scss',
})
export class SurfCalendar implements OnInit, OnDestroy {
  private readonly seo = inject(SeoService);

  readonly worldTourEvents: SurfEvent[] = [
    {
      name: 'Pipeline Pro',
      dateLabel: '29 de enero - 10 de febrero de 2026',
      location: 'Banzai Pipeline, Oahu, Hawái',
      startDate: '2026-01-29',
      endDate: '2026-02-10',
      place: { locality: 'Oahu, Hawái', country: 'US' },
      confirmed: true,
    },
    {
      name: 'Sunset Open',
      dateLabel: '12 - 24 de febrero de 2026',
      location: 'Sunset Beach, Oahu, Hawái',
      startDate: '2026-02-12',
      endDate: '2026-02-24',
      place: { locality: 'Oahu, Hawái', country: 'US' },
      confirmed: true,
    },
    {
      name: 'Peniche Pro',
      dateLabel: '11 - 20 de marzo de 2026',
      location: 'Supertubos, Peniche, Portugal',
      startDate: '2026-03-11',
      endDate: '2026-03-20',
      place: { locality: 'Peniche', country: 'PT' },
      confirmed: true,
    },
    {
      name: 'Bells Beach Pro',
      dateLabel: '10 - 20 de abril de 2026',
      location: 'Bells Beach, Victoria, Australia',
      startDate: '2026-04-10',
      endDate: '2026-04-20',
      place: { locality: 'Victoria', country: 'AU' },
      confirmed: true,
    },
    {
      name: 'Margaret River Pro',
      dateLabel: '28 de abril - 8 de mayo de 2026',
      location: 'Margaret River, Australia Occidental',
      startDate: '2026-04-28',
      endDate: '2026-05-08',
      place: { locality: 'Margaret River', country: 'AU' },
      confirmed: true,
    },
    {
      name: 'Rio Pro',
      dateLabel: '20 - 28 de junio de 2026',
      location: 'Saquarema, Río de Janeiro, Brasil',
      startDate: '2026-06-20',
      endDate: '2026-06-28',
      place: { locality: 'Saquarema', country: 'BR' },
      confirmed: true,
    },
    {
      name: 'Jeffreys Bay',
      dateLabel: '14 - 23 de julio de 2026',
      location: 'Jeffreys Bay, Sudáfrica',
      startDate: '2026-07-14',
      endDate: '2026-07-23',
      place: { locality: 'Jeffreys Bay', country: 'ZA' },
      confirmed: true,
    },
    {
      name: 'Tahiti Pro',
      dateLabel: '11 - 21 de agosto de 2026',
      location: "Teahupo'o, Tahití",
      startDate: '2026-08-11',
      endDate: '2026-08-21',
      place: { locality: "Teahupo'o", country: 'PF' },
      confirmed: true,
    },
    {
      name: 'Trestles',
      dateLabel: '5 - 13 de septiembre de 2026',
      location: 'Lower Trestles, California, EE.UU.',
      startDate: '2026-09-05',
      endDate: '2026-09-13',
      place: { locality: 'California', country: 'US' },
      confirmed: true,
    },
    {
      name: 'Final WSL',
      dateLabel: 'Septiembre 2026 (Por confirmar)',
      location: 'Lugar por confirmar',
      startDate: '2026-09',
      place: { locality: 'Por confirmar', country: 'US' },
      confirmed: false,
    },
  ];

  readonly spainEvents: SurfEvent[] = [
    {
      name: 'Pantin Classic Galicia Pro',
      dateLabel: '28 de agosto - 4 de septiembre de 2026',
      location: 'Pantín, Galicia',
      startDate: '2026-08-28',
      endDate: '2026-09-04',
      place: { locality: 'Pantín, Galicia', country: 'ES' },
      confirmed: true,
    },
    {
      name: 'Campeonato de España',
      dateLabel: 'Junio 2026 (Por confirmar)',
      location: 'Varias ubicaciones, España',
      startDate: '2026-06',
      place: { locality: 'España', country: 'ES' },
      confirmed: false,
    },
    {
      name: 'Festival de Surf de Zarautz',
      dateLabel: 'Julio 2026 (Por confirmar)',
      location: 'Zarautz, País Vasco',
      startDate: '2026-07',
      place: { locality: 'Zarautz, País Vasco', country: 'ES' },
      confirmed: false,
    },
    {
      name: 'Mundaka Pro',
      dateLabel: 'Octubre 2026 (Por confirmar)',
      location: 'Mundaka, País Vasco',
      startDate: '2026-10',
      place: { locality: 'Mundaka, País Vasco', country: 'ES' },
      confirmed: false,
    },
    {
      name: 'Festival de Surf de Barcelona',
      dateLabel: 'Mayo 2026 (Por confirmar)',
      location: 'Barcelona, Cataluña',
      startDate: '2026-05',
      place: { locality: 'Barcelona, Cataluña', country: 'ES' },
      confirmed: false,
    },
  ];

  ngOnInit(): void {
    const events = [...this.worldTourEvents, ...this.spainEvents];
    this.seo.setJsonLd(
      {
        '@context': 'https://schema.org',
        '@graph': events.map((event) => this.toSchemaEvent(event)),
      },
      JSON_LD_ID
    );
  }

  ngOnDestroy(): void {
    this.seo.setJsonLd(null, JSON_LD_ID);
  }

  private toSchemaEvent(event: SurfEvent) {
    return {
      '@type': 'SportsEvent',
      name: event.name,
      startDate: event.startDate,
      ...(event.endDate ? { endDate: event.endDate } : {}),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      sport: 'Surfing',
      inLanguage: SITE.lang,
      url: absoluteUrl('/surf-calendar'),
      location: {
        '@type': 'Place',
        name: event.location,
        address: {
          '@type': 'PostalAddress',
          addressLocality: event.place.locality,
          addressCountry: event.place.country,
        },
      },
    };
  }
}
