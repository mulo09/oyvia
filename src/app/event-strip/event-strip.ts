import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SurfEvent {
  dateRange: string;
  eventNumber: string;
  name: string;
  presenter: string;
  location: string;
  country: string;
  status?: 'live' | 'upcoming' | 'completed';
  // Start date used to drive the countdown timer.
  startDate?: Date;
}

@Component({
  selector: 'app-event-strip',
  imports: [CommonModule],
  templateUrl: './event-strip.html',
  styleUrl: './event-strip.scss',
})
export class EventStrip implements OnInit, OnDestroy {
  days = signal('00');
  hours = signal('00');
  minutes = signal('00');
  seconds = signal('00');

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  // The countdown target is resolved from the events list in ngOnInit so it
  // always points at a real upcoming date instead of a stale hardcoded value.
  private nextCallDate: Date | null = null;

  events: SurfEvent[] = [
    {
      dateRange: 'JUL 18 - JUL 26',
      eventNumber: 'EVENTO 03',
      name: 'FESTIVAL DE SURF DE ZARAUTZ',
      presenter: 'Presentado por Euskadi Surf',
      location: 'Zarautz, País Vasco',
      country: '🇪🇸',
      status: 'live',
      startDate: new Date('2026-07-18T07:00:00'),
    },
    {
      dateRange: 'AGO 28 - SEP 4',
      eventNumber: 'EVENTO 04',
      name: 'PANTIN CLASSIC GALICIA PRO',
      presenter: 'Presentado por Estrella Galicia',
      location: 'Pantín, Galicia',
      country: '🇪🇸',
      status: 'upcoming',
      startDate: new Date('2026-08-28T07:00:00'),
    },
    {
      dateRange: 'SEP 12 - SEP 20',
      eventNumber: 'EVENTO 05',
      name: 'SOMO PRO SANTANDER',
      presenter: 'Presentado por Cantabria Deporte',
      location: 'Somo, Cantabria',
      country: '🇪🇸',
      status: 'upcoming',
      startDate: new Date('2026-09-12T07:00:00'),
    },
    {
      dateRange: 'OCT 3 - OCT 11',
      eventNumber: 'EVENTO 06',
      name: 'MUNDAKA SURF FESTIVAL',
      presenter: 'Presentado por Euskadi Basque Country',
      location: 'Mundaka, País Vasco',
      country: '🇪🇸',
      status: 'upcoming',
      startDate: new Date('2026-10-03T07:00:00'),
    },
    {
      dateRange: 'NOV 7 - NOV 15',
      eventNumber: 'EVENTO 07',
      name: 'FUERTEVENTURA PRO',
      presenter: 'Presentado por Islas Canarias',
      location: 'Corralejo, Fuerteventura',
      country: '🇪🇸',
      status: 'upcoming',
      startDate: new Date('2026-11-07T07:00:00'),
    },
  ];

  ngOnInit() {
    this.nextCallDate = this.resolveNextCallDate();
    this.updateCountdown();
    this.timerInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  /**
   * Finds the soonest event whose start date is still in the future so the
   * countdown always targets a valid upcoming date.
   */
  private resolveNextCallDate(): Date | null {
    const now = Date.now();
    const upcoming = this.events
      .map((e) => e.startDate)
      .filter((d): d is Date => !!d && d.getTime() > now)
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming[0] ?? null;
  }

  private updateCountdown() {
    if (!this.nextCallDate) {
      this.days.set('00');
      this.hours.set('00');
      this.minutes.set('00');
      this.seconds.set('00');
      return;
    }

    const now = new Date();
    const diff = this.nextCallDate.getTime() - now.getTime();

    if (diff <= 0) {
      this.days.set('00');
      this.hours.set('00');
      this.minutes.set('00');
      this.seconds.set('00');
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    this.days.set(d.toString().padStart(2, '0'));
    this.hours.set(h.toString().padStart(2, '0'));
    this.minutes.set(m.toString().padStart(2, '0'));
    this.seconds.set(s.toString().padStart(2, '0'));
  }

  scrollLeft() {
    const container = document.querySelector('.event-strip__scroll');
    if (container) {
      container.scrollBy({ left: -350, behavior: 'smooth' });
    }
  }

  scrollRight() {
    const container = document.querySelector('.event-strip__scroll');
    if (container) {
      container.scrollBy({ left: 350, behavior: 'smooth' });
    }
  }
}

