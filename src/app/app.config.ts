import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { Conectionws2 } from './services/conectionws';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Without this the router leaves the scroll position untouched between
    // routes, so opening an article from far down the home page lands the
    // reader in the middle of the new page (an apparently blank screen).
    // 'enabled' scrolls to the top on a new navigation and restores the
    // previous offset on back/forward.
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(),
    Conectionws2
  ]
};
