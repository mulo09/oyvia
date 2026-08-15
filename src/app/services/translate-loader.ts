import { DOCUMENT, Injectable, inject } from '@angular/core';

const SCRIPT_ID = 'google-translate-widget';
const SCRIPT_SRC =
  'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

/**
 * Loads the Google Translate widget on demand instead of from a blocking
 * <script> in index.html, which used to delay first render on every visit.
 */
@Injectable({ providedIn: 'root' })
export class TranslateLoader {
  private readonly document = inject(DOCUMENT);
  private loading?: Promise<void>;

  /** True when a previous visit selected a language other than Spanish. */
  hasActiveTranslation(): boolean {
    return /(^|;\s*)googtrans=\/[a-z]{2}\/[a-z]{2}/i.test(this.document.cookie);
  }

  load(): Promise<void> {
    if (this.loading) {
      return this.loading;
    }

    this.loading = new Promise<void>((resolve, reject) => {
      const win = this.document.defaultView as any;
      if (!win) {
        resolve();
        return;
      }

      if (this.document.getElementById(SCRIPT_ID)) {
        resolve();
        return;
      }

      // The widget script calls this global as soon as it finishes loading.
      win.googleTranslateElementInit = () => {
        new win.google.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'es,en,fr,pt,de,it',
            autoDisplay: false,
          },
          'google_translate_element'
        );
        resolve();
      };

      const script = this.document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onerror = () => {
        this.loading = undefined;
        reject(new Error('Google Translate widget failed to load'));
      };
      this.document.body.appendChild(script);
    });

    return this.loading;
  }
}
