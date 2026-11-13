import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectorRef,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { VideoHero } from '../../shared/video-hero/video-hero';

import { SeoMetaService } from '../../app/services/seo-meta.service';
import { logError } from '../../app/utils/logger';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import {
  getPrimaryTagName,
  type GenContentListNode,
} from '../../app/api/graphql';
import { readingTimeMinutes } from '../../app/utils/reading-time.util';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { ButtonPrimaryComponent } from '../../shared/button-primary/button-primary.component';
import { BlogCardComponent } from '../../shared/blog-card/blog-card.component';
import { RecaptchaLoaderService } from '../../app/services/recaptcha-loader.service';

// All page copy / image URLs live in this JSON (requires "resolveJsonModule": true in tsconfig).
import pageContent from '../../../public/microsoft-licensing.json';

export type MicrosoftLicensingContent = typeof pageContent;

@Component({
  selector: 'app-microsoft-licensing',
  imports: [
    CommonModule,
    VideoHero,
    FormsModule,
    CtaSectionComponent,
    ButtonPrimaryComponent,
    BlogCardComponent,
  ],
  templateUrl: './microsoft-licensing.html',
  styleUrl: './microsoft-licensing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MicrosoftLicensing implements AfterViewInit, OnInit, OnDestroy {
  private readonly seoMeta = inject(SeoMetaService);
  readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly graphql = inject(GraphQLContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly recaptcha = inject(RecaptchaLoaderService);
  private recaptchaObserver: IntersectionObserver | null = null;

  @ViewChild('recaptchaHost') recaptchaHost?: ElementRef<HTMLElement>;

  /** Starts with bundled content, then prefers WordPress content when available. */
  content: MicrosoftLicensingContent = pageContent;

  selectedAccordionItem: any = null;

  // Form properties
  submitted = false;
  isSubmitting = false;
  private recaptchaWidgetId: number | null = null;
  readonly recaptchaEnabled = true;
  recaptchaToken: string | null = null;

  private readonly defaultInterest =
    pageContent.licensingForm.fields.primaryAreaOfInterest.options[0].value;

  licensingFormModel = {
    fullName: '',
    email: '',
    company: '',
    numberOfUsers: '',
    primaryAreaOfInterest: this.defaultInterest,
    environmentDetails: '',
  };

  usersDropdownOpen = false;
  interestDropdownOpen = false;

  validationErrors = {
    fullName: false,
    email: false,
    company: false,
    numberOfUsers: false,
    primaryAreaOfInterest: false,
    environmentDetails: false,
    recaptcha: false,
  };
  private _svgIcons: Record<string, string> | undefined = undefined;

  private async loadSvgIcons(): Promise<Record<string, string>> {
    if (this._svgIcons !== undefined) return this._svgIcons as Record<string, string>;
    try {
      const m = await import('../../shared/service-icons/service-icons');
      this._svgIcons = (m && (m as any).SvgIcons) || {};
      return this._svgIcons as Record<string, string>;
    } catch (e) {
      this._svgIcons = {};
      return this._svgIcons as Record<string, string>;
    }
  }

  readonly relatedLicensingBlogs = signal<
    Array<{
      id: string;
      slug: string;
      title: string;
      imageUrl: string;
      imageAlt: string;
      primaryTag: string;
      readingTimeMinutes: number;
      date: string;
    }>
  >([]);
  readonly relatedBlogsLoading = signal<boolean>(true);

  constructor() {
    this.seoMeta.updateMeta({ ...this.content.seo });
  }

  ngOnInit(): void {
    this.loadPageContent();
    this.loadRelatedLicensingBlogs();
  }

  private loadPageContent(): void {
    this.graphql
      .getMicrosoftLicensingContent()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          // Keep the bundled content as the fallback when WordPress has no usable page.
          if (data && typeof data === 'object') {
            this.applyPageContent(deepMerge(pageContent, data));
          }
        },
        error: (error) =>
          logError('Error loading Microsoft Licensing content from WordPress:', error),
      });
  }

  private applyPageContent(content: MicrosoftLicensingContent): void {
    this.content = content;
    this.seoMeta.updateMeta({ ...content.seo });
    this.cdr.markForCheck();
  }

  private loadRelatedLicensingBlogs(): void {
    this.relatedBlogsLoading.set(true);

    // Tag query and the all-blogs fallback fire together instead of sequentially — when
    // the tag genuinely has no matches (as of writing, 'microsoft-licensing' has none),
    // the old code paid for two round-trips back to back before rendering anything.
    // getBlogs() is a shared shareReplay(1) stream, so this doesn't cost extra on pages
    // where something else already primed it.
    forkJoin({
      tagged: this.graphql.getGenContentsByTagAndCategory(
        this.content.relatedBlogs.tagSlug,
        'blog',
        6,
      ),
      // getBlogs() is a watchQuery().valueChanges stream — it never completes on its own
      // (stays open for cache updates), so forkJoin would wait on it forever without take(1).
      allBlogs: this.graphql.getBlogs().pipe(take(1)),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tagged, allBlogs }) => {
          const nodes =
            tagged.length > 0
              ? tagged
              : allBlogs.filter((post) => this.isMicrosoftLicensingPost(post));
          this.relatedLicensingBlogs.set(
            this.mapRelatedBlogCards(nodes).slice(0, 3),
          );
          this.relatedBlogsLoading.set(false);
          this.cdr.markForCheck();
        },
        // Both sources already fall back to [] internally, but this is a last-resort
        // guard so this section can never get stuck on its loading skeleton forever.
        error: () => {
          this.relatedBlogsLoading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private mapRelatedBlogCards(nodes: GenContentListNode[]) {
    const fb = this.content.relatedBlogs.fallbacks;
    return nodes.map((post) => ({
      id: post.id ?? post.slug ?? '',
      slug: post.slug ?? '',
      title: post.title ?? fb.title,
      imageUrl: post.featuredImage?.node?.sourceUrl ?? fb.imageUrl,
      imageAlt: post.featuredImage?.node?.altText ?? post.title ?? fb.imageAlt,
      primaryTag:
        getPrimaryTagName(post.primaryTagName) ?? post.tags?.[0] ?? fb.tag,
      readingTimeMinutes: readingTimeMinutes(
        (post.content ?? '') || (post.excerpt ?? ''),
      ),
      date: post.date ?? '',
    }));
  }

  private isMicrosoftLicensingPost(post: GenContentListNode): boolean {
    const normalizedTarget = this.content.relatedBlogs.tagSlug;
    const norm = (value: string | null | undefined) =>
      (value ?? '').toLowerCase().trim().replace(/\s+/g, '-');

    const hasTagSlug =
      post.genContentTags?.nodes?.some(
        (tag) => norm(tag.slug) === normalizedTarget,
      ) ?? false;
    const hasTagName =
      post.genContentTags?.nodes?.some(
        (tag) => norm(tag.name) === normalizedTarget,
      ) ?? false;
    const hasLegacyTag =
      post.tags?.some((tag) => norm(tag) === normalizedTarget) ?? false;
    const hasPrimaryTag =
      norm(getPrimaryTagName(post.primaryTagName)) === normalizedTarget;

    return hasTagSlug || hasTagName || hasLegacyTag || hasPrimaryTag;
  }

  getIconSvg(iconKey: string) {
    const svg = (this._svgIcons && this._svgIcons[iconKey]) || '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getIconImageSrc(iconKey: string): string {
    const svg = (this._svgIcons && this._svgIcons[iconKey]) || '';
    if (!svg) return '';
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  setSelectedAccordionItem(item: any) {
    this.selectedAccordionItem = item;
  }

  clearSelectedAccordionItem() {
    this.selectedAccordionItem = null;
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && this.recaptchaEnabled) {
      this.observeRecaptcha();
    }
    // eager client-side preload of icons for this page
    void this.loadSvgIcons();
  }

  /** Defers loading/rendering reCAPTCHA until the form is actually scrolled into view. */
  private observeRecaptcha(): void {
    const host = this.recaptchaHost?.nativeElement;
    const container = host?.parentElement;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    this.recaptchaObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.recaptchaObserver?.disconnect();
          this.recaptchaObserver = null;
          this.renderRecaptcha();
        }
      },
      { rootMargin: '200px' },
    );
    this.recaptchaObserver.observe(container);
  }

  private renderRecaptcha(): void {
    const host = this.recaptchaHost?.nativeElement;
    if (!host || this.recaptchaWidgetId !== null) return;

    this.recaptcha
      .render(host, {
        onSuccess: (token) => {
          this.recaptchaToken = token;
          this.validationErrors = { ...this.validationErrors, recaptcha: false };
          this.cdr.markForCheck();
        },
        onExpired: () => {
          this.recaptchaToken = null;
          this.cdr.markForCheck();
        },
      })
      .then((widgetId) => {
        this.recaptchaWidgetId = widgetId;
      });
  }

  ngOnDestroy(): void {
    this.recaptchaObserver?.disconnect();
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toggleUsersDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
    this.interestDropdownOpen = false;
    this.usersDropdownOpen = !this.usersDropdownOpen;
  }

  closeUsersDropdown(): void {
    this.usersDropdownOpen = false;
  }

  selectUsersOption(value: string): void {
    this.licensingFormModel.numberOfUsers = value;
    this.validationErrors = {
      ...this.validationErrors,
      numberOfUsers: false,
    };
    this.usersDropdownOpen = false;
  }

  get selectedUsersLabel(): string {
    const field = this.content.licensingForm.fields.numberOfUsers;
    const selected = field.options.find(
      (option:any) => option.value === this.licensingFormModel.numberOfUsers,
    );
    return selected?.label ?? field.placeholder;
  }

  toggleInterestDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
    this.usersDropdownOpen = false;
    this.interestDropdownOpen = !this.interestDropdownOpen;
  }

  selectInterestOption(value: string): void {
    this.licensingFormModel.primaryAreaOfInterest = value;
    this.validationErrors = {
      ...this.validationErrors,
      primaryAreaOfInterest: false,
    };
    this.interestDropdownOpen = false;
  }

  get selectedInterestLabel(): string {
    const field = this.content.licensingForm.fields.primaryAreaOfInterest;
    const selected = field.options.find(
      (option:any) =>
        option.value === this.licensingFormModel.primaryAreaOfInterest,
    );
    return selected?.label ?? field.placeholder;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (!target.closest('.ml-users-dropdown')) {
      this.usersDropdownOpen = false;
    }
    if (!target.closest('.ml-interest-dropdown')) {
      this.interestDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.usersDropdownOpen = false;
    this.interestDropdownOpen = false;
  }

  onLicensingReviewSubmit() {
    this.submitted = true;

    this.validationErrors = {
      fullName: !this.licensingFormModel.fullName,
      email:
        !this.licensingFormModel.email ||
        !this.validateEmail(this.licensingFormModel.email),
      company: !this.licensingFormModel.company,
      numberOfUsers: !this.licensingFormModel.numberOfUsers,
      primaryAreaOfInterest: !this.licensingFormModel.primaryAreaOfInterest,
      environmentDetails: !this.licensingFormModel.environmentDetails,
      recaptcha: this.recaptchaEnabled && !this.recaptchaToken,
    };

    if (
      !this.licensingFormModel.fullName ||
      !this.licensingFormModel.email ||
      !this.validateEmail(this.licensingFormModel.email) ||
      !this.licensingFormModel.company ||
      !this.licensingFormModel.numberOfUsers ||
      !this.licensingFormModel.primaryAreaOfInterest ||
      !this.licensingFormModel.environmentDetails ||
      (this.recaptchaEnabled && !this.recaptchaToken)
    ) {
      return;
    }

    this.isSubmitting = true;

    const message = [
      'Licensing review request details:',
      `Full Name: ${this.licensingFormModel.fullName}`,
      `Email: ${this.licensingFormModel.email}`,
      `Name of Company: ${this.licensingFormModel.company}`,
      `Number of users: ${this.licensingFormModel.numberOfUsers}`,
      `Primary area of interest: ${this.licensingFormModel.primaryAreaOfInterest}`,
      `Environment details: ${this.licensingFormModel.environmentDetails}`,
    ].join('\n');

    const payload = {
      fullName: this.licensingFormModel.fullName,
      email: this.licensingFormModel.email,
      company: this.licensingFormModel.company,
      message,
      numberOfUsers: this.licensingFormModel.numberOfUsers,
      primaryAreaOfInterest: this.licensingFormModel.primaryAreaOfInterest,
      environmentDetails: this.licensingFormModel.environmentDetails,
      formType: 'licensing-review',
    };

    const messages = this.content.licensingForm.messages;

    this.http.post<{ success: boolean }>('/api/contact', payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        if (res?.success) {
          this.resetLicensingForm();
          this.router.navigate(['/contact-success']);
        } else {
          alert(messages.submitFailed);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        logError('Licensing form error:', err);
        alert(messages.submitError);
      },
    });
  }

  private resetLicensingForm() {
    this.licensingFormModel = {
      fullName: '',
      email: '',
      company: '',
      numberOfUsers: '',
      primaryAreaOfInterest: this.defaultInterest,
      environmentDetails: '',
    };

    this.submitted = false;
    this.validationErrors = {
      fullName: false,
      email: false,
      company: false,
      numberOfUsers: false,
      primaryAreaOfInterest: false,
      environmentDetails: false,
      recaptcha: false,
    };
    this.recaptchaToken = null;
    this.recaptcha.reset(this.recaptchaWidgetId);
  }
}

/** Keeps the bundled shape; takes remote values only where the type matches. Remote arrays replace defaults if non-empty. */
function deepMerge<T>(base: T, remote: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(remote) && remote.length > 0 ? remote : base) as T;
  }
  if (base && typeof base === 'object') {
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) return base;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(base)) {
      out[key] = deepMerge((base as any)[key], (remote as any)[key]);
    }
    return out as T;
  }
  return (typeof remote === typeof base && remote !== '' ? remote : base) as T;
}