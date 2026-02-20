import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject, PLATFORM_ID, isDevMode, APP_INITIALIZER } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client';
import { GraphQLContentService } from './services/graphql-content.service';

/** En browser: ruta relativa (resuelve a localhost:4200/api/graphql en dev). En server: URL absoluta. */
const GRAPHQL_URI_BROWSER = '/api/graphql';
const GRAPHQL_URI_SERVER = isDevMode()
  ? 'http://localhost:4200/api/graphql'
  : 'https://oakwoodsys.com/graphql';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (graphql: GraphQLContentService) => () =>
        Promise.all([
          graphql.loadGenContentTaxonomies(),
          graphql.loadHomePageContent(),
        ]).then(() => undefined),
      deps: [GraphQLContentService],
      multi: true,
    },
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ), provideClientHydration(withEventReplay()), provideHttpClient(withFetch()), provideApollo(() => {
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
