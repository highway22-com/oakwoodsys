import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject, PLATFORM_ID, isDevMode } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { CMS_BASE_URL } from './config/cms.config';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { apiNoCacheInterceptor } from './interceptors/api-no-cache.interceptor';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client';

/** En browser: ruta relativa (resuelve a localhost:4200/api/graphql en dev). En server: URL absoluta. */
const GRAPHQL_URI_BROWSER = '/api/graphql';
const GRAPHQL_URI_SERVER = isDevMode()
  ? 'http://localhost:4200/api/graphql'
  : `${CMS_BASE_URL}/graphql`;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ), provideClientHydration(withEventReplay()), provideHttpClient(withFetch(), withInterceptors([apiNoCacheInterceptor])), provideApollo(() => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);
      const isBrowser = isPlatformBrowser(platformId);
      const uri = isBrowser ? GRAPHQL_URI_BROWSER : GRAPHQL_URI_SERVER;

      return {
        link: httpLink.create({ uri }),
        cache: new InMemoryCache(),
        ssrMode: !isBrowser,
      };
    })
  ]
};