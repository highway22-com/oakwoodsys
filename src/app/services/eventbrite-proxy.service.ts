import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { CMS_BASE_URL } from '../config/cms.config';

export type EventbriteApiObject = Record<string, unknown>;

export interface EventbriteEventListResponse {
  events?: EventbriteApiObject[];
  pagination?: EventbriteApiObject;
}

export interface EventbritePublicConfig {
  organizationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventbriteProxyService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly proxyJsonRequest = {
    headers: new HttpHeaders({
      Accept: 'application/json',
    }),
    transferCache: false as const,
  };

  private basePath(): string {
    if (isPlatformBrowser(this.platformId)) {
      return '/api/eventbrite';
    }
    return `${CMS_BASE_URL}/wp-json/oakwood/v1/eventbrite`;
  }

  getPublicConfig(): Observable<EventbritePublicConfig> {
    return this.http.get<EventbritePublicConfig>(
      `${this.basePath()}/public-config`,
      this.proxyJsonRequest,
    );
  }

  getEvent(eventId: string): Observable<EventbriteApiObject> {
    const id = String(eventId).replace(/\D/g, '');
    return this.http.get<EventbriteApiObject>(
      `${this.basePath()}/event/${id}`,
      this.proxyJsonRequest,
    );
  }

  getOrganizationEvents(
    organizationId: string,
    params?: Record<string, string>,
  ): Observable<EventbriteEventListResponse> {
    const id = String(organizationId).replace(/\D/g, '');
    let httpParams = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') {
          httpParams = httpParams.set(k, v);
        }
      }
    }
    return this.http.get<EventbriteEventListResponse>(
      `${this.basePath()}/organization/${id}/events`,
      { ...this.proxyJsonRequest, params: httpParams },
    );
  }
}
