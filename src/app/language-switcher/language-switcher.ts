import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateLoader } from '../services/translate-loader';

@Component({
  selector: 'app-language-switcher',
  imports: [CommonModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss'
})
export class LanguageSwitcher implements OnInit {
  isOpen = false;
  currentLang = 'ES';

  languages = [
    { code: 'es', label: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'PT', name: 'Português', flag: '🇵🇹' },
    { code: 'de', label: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'IT', name: 'Italiano', flag: '🇮🇹' }
  ];

  private readonly translateLoader = inject(TranslateLoader);

  constructor(private elRef: ElementRef) {}

  ngOnInit() {
    // Detect current language from googtrans cookie
    const match = document.cookie.match(/googtrans=\/es\/(\w+)/);
    if (match) {
      const lang = this.languages.find(l => l.code === match[1]);
      if (lang) {
        this.currentLang = lang.label;
      }
    }

    // Only pull in the Google Translate widget when the page actually needs to
    // be translated; otherwise it is loaded when the user opens the dropdown.
    if (this.translateLoader.hasActiveTranslation()) {
      this.translateLoader.load().catch(() => {});
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Warm up the widget so the reload after picking a language is instant.
      this.translateLoader.load().catch(() => {});
    }
  }

  selectLanguage(lang: { code: string; label: string; name: string; flag: string }) {
    if (lang.label === this.currentLang) {
      this.isOpen = false;
      return;
    }

    this.currentLang = lang.label;
    this.isOpen = false;

    if (lang.code === 'es') {
      // Spanish is the original content language: clear cookie and reload
      this.setCookie('googtrans', '', -1);
      // Also clear domain cookie
      const domain = location.hostname;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
      window.location.reload();
    } else {
      // Translate from Spanish to target language
      this.setCookie('googtrans', `/es/${lang.code}`, 365);
      window.location.reload();
    }
  }

  private setCookie(name: string, value: string, days: number) {
    const domain = location.hostname;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();

    // Set for current path
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    // Set for domain (needed by Google Translate)
    document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=.${domain}`;
  }

  get currentFlag(): string {
    return this.languages.find(l => l.label === this.currentLang)?.flag ?? '🌐';
  }
}

