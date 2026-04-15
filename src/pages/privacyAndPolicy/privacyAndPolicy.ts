import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { GraphQLContentService } from '../../app/services/graphql-content.service';

export interface PrivacyPolicySection {
  title: string;
  content: string[];
}

export interface PrivacyPolicyContent {
  title: string;
  intro: string[];
  sections: PrivacyPolicySection[];
}

@Component({
  selector: 'app-privacy-and-policy',
  imports: [CommonModule, RouterLink],
  templateUrl: './privacyAndPolicy.html',
  styleUrl: './privacyAndPolicy.css',
})
export default class PrivacyAndPolicy implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);
  private readonly supportEmailText = 'help@oakwoodsys.com';
  private readonly supportPhoneText = '(314) 824-3000';
  private _contentOverride: PrivacyPolicyContent | null = null;
  private hasOverride = false;

  @Input()
  set contentOverride(value: PrivacyPolicyContent | null) {
    this._contentOverride = value;
    if (value) {
      this.hasOverride = true;
      this.content.set(value);
      this.loading.set(false);
    }
  }

  get contentOverride(): PrivacyPolicyContent | null {
    return this._contentOverride;
  }

  readonly content = signal<PrivacyPolicyContent | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    // If contentOverride is provided (edit mode), use it directly
    if (this.hasOverride) {
      return;
    }

    // Otherwise, fetch from BE (cms slug: privacy-policy), fallback to static JSON.
    this.graphql
      .getCmsPageBySlug('privacy-policy', { fetchPolicy: 'network-only' })
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          const normalized = this.normalizePrivacyPolicyData(data as Record<string, unknown> | null);
          if (normalized) {
            this.content.set(normalized);
            this.loading.set(false);
            return;
          }
          this.loadFromStaticFallback();
        },
        error: () => this.loadFromStaticFallback(),
      });
  }

  private loadFromStaticFallback(): void {
    this.http
      .get<PrivacyPolicyContent>('/privacy-policy-content.json')
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.content.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private normalizePrivacyPolicyData(data: Record<string, unknown> | null): PrivacyPolicyContent | null {
    if (!data || typeof data !== 'object') return null;

    const maybeWrapped = data['content'];
    const candidate = (maybeWrapped && typeof maybeWrapped === 'object'
      ? maybeWrapped
      : data) as Record<string, unknown>;

    if (typeof candidate['title'] !== 'string') return null;
    if (!Array.isArray(candidate['intro'])) return null;
    if (!Array.isArray(candidate['sections'])) return null;

    return candidate as unknown as PrivacyPolicyContent;
  }

  stripBulletPoint(item: string): string {
    return item.replace(/^\s*[\-•]\s*/, '').trim();
  }

  hasSupportContactLinks(para: string): boolean {
    return para.includes(this.supportEmailText) && para.includes(this.supportPhoneText);
  }

  getTextBeforeSupportEmail(para: string): string {
    const emailIndex = para.indexOf(this.supportEmailText);
    if (emailIndex === -1) return para;
    return para.substring(0, emailIndex);
  }

  getTextBetweenSupportEmailAndPhone(para: string): string {
    const emailIndex = para.indexOf(this.supportEmailText);
    const phoneIndex = para.indexOf(this.supportPhoneText);
    if (emailIndex === -1 || phoneIndex === -1 || phoneIndex < emailIndex) return '';
    return para.substring(emailIndex + this.supportEmailText.length, phoneIndex);
  }

  getTextAfterSupportPhone(para: string): string {
    const phoneIndex = para.indexOf(this.supportPhoneText);
    if (phoneIndex === -1) return '';
    return para.substring(phoneIndex + this.supportPhoneText.length);
  }

  getIntroTextBeforeLink(para: string): string {
    const policyIndex = para.indexOf('Privacy Policy Template');
    if (policyIndex !== -1) {
      return para.substring(0, policyIndex);
    }
    return para.substring(0, para.indexOf('Disclaimer Template'));
  }

  getIntroTextBetweenLinks(para: string): string {
    const policyIndex = para.indexOf('Privacy Policy Template');
    const disclaimerIndex = para.indexOf('Disclaimer Template');

    if (policyIndex !== -1 && disclaimerIndex !== -1) {
      return para.substring(policyIndex + 23, disclaimerIndex);
    }
    return '';
  }

  getIntroTextAfterLink(para: string): string {
    const disclaimerIndex = para.indexOf('Disclaimer Template');
    if (disclaimerIndex !== -1) {
      return para.substring(disclaimerIndex + 18);
    }
    const policyIndex = para.indexOf('Privacy Policy Template');
    if (policyIndex !== -1) {
      return para.substring(policyIndex + 23);
    }
    return '';
  }
}
