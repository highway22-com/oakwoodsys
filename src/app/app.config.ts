import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject, PLATFORM_ID, isDevMode, APP_INITIALIZER } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

import { routes } from './app.routes';
import { CMS_BASE_URL } from './config/cms.config';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { HttpHeaders, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { apiNoCacheInterceptor } from './interceptors/api-no-cache.interceptor';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, InMemoryCache } from '@apollo/client';
import { GraphQLContentService } from './services/graphql-content.service';

/** En browser: ruta relativa (resuelve a localhost:4200/api/graphql en dev). En server: URL absoluta. */
const GRAPHQL_URI_BROWSER = '/api/graphql';
const GRAPHQL_URI_SERVER = isDevMode()
  ? 'http://localhost:4200/api/graphql'
  : `${CMS_BASE_URL}/graphql`;

export const appConfig: ApplicationConfig = {
  providers: [
    provideMonacoEditor({ baseUrl: './assets/monaco/min/vs', defaultOptions: { scrollBeyondLastLine: false } }),
    {
      provide: APP_INITIALIZER,
      useFactory: (graphql: GraphQLContentService) => () =>
        Promise.all([
          graphql.loadGenContentTaxonomies(),
          graphql.loadHomePageContent(),
          graphql.loadServicesContent(),
          graphql.loadIndustriesContent(),
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
    ), provideClientHydration(withEventReplay()), provideHttpClient(withFetch(), withInterceptors([apiNoCacheInterceptor])), provideApollo(() => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);
      const isBrowser = isPlatformBrowser(platformId);
      const uri = isBrowser ? GRAPHQL_URI_BROWSER : GRAPHQL_URI_SERVER;

      const noCacheLink = new ApolloLink((operation, forward) => {
        const ctx = operation.getContext();
        const existing = (ctx?.headers as HttpHeaders | undefined) ?? new HttpHeaders();
        const headers = existing
          .set('Cache-Control', 'no-cache')
          .set('Pragma', 'no-cache');
        operation.setContext({ headers });
        return forward(operation);
      });
      return {
        link: noCacheLink.concat(httpLink.create({ uri })),
        cache: new InMemoryCache(),
        ssrMode: !isBrowser,
      };
    })
  ]
};
