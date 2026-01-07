import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgClass, isPlatformBrowser } from '@angular/common';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { Apollo, gql } from 'apollo-angular';
import { FormsModule } from '@angular/forms';

interface HomeContent {
  page: string;
  videoUrls?: string[];
  sections: any[];
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgClass, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  readonly content = signal<HomeContent | null>(null);
  readonly loading = signal(true);
  readonly videoUrls = signal<string[]>([]);
  readonly currentVideoIndex = signal(0);
  readonly currentVideoUrl = computed(() => {
    const urls = this.videoUrls();
    const index = this.currentVideoIndex();
    return urls[index] || urls[0] || '';
  });
  private videoInterval: any;

  private readonly apollo = inject(Apollo);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  readonly sanitizer = inject(DomSanitizer);
  readonly posts = signal<any>(null);
  readonly error = signal<any>(null);
  readonly structuredData = signal<any>(null);
  readonly isAdmin = signal(false);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly panelVisible = signal(false);
  jsonContent: string = '';
  readonly jsonError = signal<string | null>(null);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', () => this.enableAutoplay(), { once: true });

      // Check if user is admin
      const token = localStorage.getItem('admin_token');
      this.isAdmin.set(!!token);
    }

    // Try to load from external URL via proxy endpoint (bypasses CORS)
    // The proxy endpoint is defined in server.ts and only works in SSR mode
    // If admin is logged in, server will serve local file for editing
    // Fallback to local file on error (e.g., during dev with ng serve)
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('admin_token') : null;
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.http.get<HomeContent>('/api/home-content', { headers }).subscribe({
      //this.http.get<HomeContent>('/home-content.json').subscribe({
      next: (data) => {
        this.content.set(data);
        if (data.videoUrls && data.videoUrls.length > 0) {
          this.videoUrls.set(data.videoUrls);
        }
        // Initialize JSON content for admin editor
        if (this.isAdmin()) {
          this.jsonContent = JSON.stringify(data, null, 2);
        }
        this.updateMetadata(data);
        this.updateStructuredData(data);
        this.loading.set(false);
      },
      error: (error) => {
        // Fallback to local file if proxy fails (e.g., in dev mode or if proxy is unavailable)
        console.warn('Error loading external home content via proxy, falling back to local file:', error);
        // Fallback to local file
        this.http.get<HomeContent>('/home-content.json').subscribe({
          next: (data) => {
            this.content.set(data);
            if (data.videoUrls && data.videoUrls.length > 0) {
              this.videoUrls.set(data.videoUrls);
            }
            // Initialize JSON content for admin editor
            if (this.isAdmin()) {
              this.jsonContent = JSON.stringify(data, null, 2);
            }
            this.updateMetadata(data);
            this.updateStructuredData(data);
            this.loading.set(false);
          },
          error: (fallbackError) => {
            console.error('Error loading local home content:', fallbackError);
            this.loading.set(false);
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    setTimeout(() => {
      if (this.videoElement) {
        // Load the initial video
        const initialUrl = this.currentVideoUrl();
        if (initialUrl) {
          this.loadVideo(initialUrl);
        }
        this.videoElement.nativeElement.addEventListener('loadedmetadata', () => {
          this.attemptAutoplay();
          this.startVideoCarousel();
        });
        this.videoElement.nativeElement.addEventListener('ended', () => {
          this.nextVideo();
        });
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
    }
  }

  onVideoError(event: Event) {
    const video = event.target as HTMLVideoElement;
    console.error('[Video] HTML error event:', {
      networkState: video.networkState,
      readyState: video.readyState,
      error: video.error,
      src: video.src
    });
  }

  onVideoLoadStart(event: Event) {
    const video = event.target as HTMLVideoElement;
    console.log('[Video] Load started:', video.src);
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    console.log('[Video] Loaded:', video.src, {
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });
  }

  private attemptAutoplay() {
    if (!this.videoElement) return;
    const video = this.videoElement.nativeElement;
    if (!video.paused) {
      return;
    }

    video.muted = true;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Video started playing successfully
      }).catch((error) => {
        if (error.name === 'NotAllowedError') {
          // Autoplay was prevented, will be enabled on user interaction
        } else if (error.name === 'NotSupportedError') {
          console.error('Video format not supported');
        } else if (error.name === 'NotReadableError') {
          console.error('Video file cannot be read');
        } else if (error.name === 'AbortError') {
          console.error('Video playback was aborted');
        } else {
          console.error('Unknown error occurred:', error);
        }
      });
    }
  }

  private enableAutoplay() {
    if (this.videoElement && this.videoElement.nativeElement.paused) {
      this.attemptAutoplay();
    }
  }

  private startVideoCarousel() {
    // Clear any existing interval
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
    }

    // Switch video every 10 seconds
    this.videoInterval = setInterval(() => {
      this.nextVideo();
    }, 10000);
  }

  switchToVideo(index: number) {
    const urls = this.videoUrls();
    if (index >= 0 && index < urls.length) {
      this.currentVideoIndex.set(index);
      this.loadVideo(urls[index]);

      // Reset the carousel timer
      this.startVideoCarousel();
    }
  }

  private nextVideo() {
    const urls = this.videoUrls();
    const currentIndex = this.currentVideoIndex();
    const nextIndex = (currentIndex + 1) % urls.length;
    this.switchToVideo(nextIndex);
  }

  private loadVideo(url: string) {
    if (!this.videoElement) return;

    const video = this.videoElement.nativeElement;

    // Clear previous error handlers
    const errorHandler = (e: Event) => {
      console.error('[Video] Error loading video:', url, {
        event: e,
        networkState: video.networkState,
        readyState: video.readyState,
        videoError: video.error
      });

      // Try next video if available
      const urls = this.videoUrls();
      const currentIndex = this.currentVideoIndex();
      if (urls.length > 1) {
        const nextIndex = (currentIndex + 1) % urls.length;
        if (nextIndex !== currentIndex) {
          console.log('[Video] Attempting to load next video:', urls[nextIndex]);
          this.currentVideoIndex.set(nextIndex);
          this.loadVideo(urls[nextIndex]);
        }
      }
    };

    const abortHandler = () => {
      console.warn('[Video] Video load aborted:', url);
    };

    // Remove old listeners
    video.removeEventListener('error', errorHandler);
    video.removeEventListener('abort', abortHandler);

    // Add new listeners
    video.addEventListener('error', errorHandler, { once: true });
    video.addEventListener('abort', abortHandler, { once: true });

    console.log('[Video] Loading video:', url);
    video.src = url;
    video.load();

    video.addEventListener('loadeddata', () => {
      console.log('[Video] Video loaded successfully:', url);
      this.attemptAutoplay();
    }, { once: true });

    video.addEventListener('canplay', () => {
      console.log('[Video] Video can play:', url);
    }, { once: true });
  }

  getSection(type: string) {
    return this.content()?.sections.find(s => s.type === type);
  }

  private updateMetadata(content: HomeContent) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Get hero section for title and description
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const pageTitle = heroSection?.title
      ? `${heroSection.title} | Oakwood Systems`
      : 'Oakwood Systems - Microsoft Solutions Partner';

    this.titleService.setTitle(pageTitle);

    // Update meta description
    const description = heroSection?.description ||
      'Oakwood Systems is a certified Microsoft Solutions Partner specializing in Data & AI, Cloud Infrastructure, Application Innovation, and Modern Work solutions.';
    this.metaService.updateTag({ name: 'description', content: description });

    // Open Graph tags
    this.metaService.updateTag({ property: 'og:title', content: heroSection?.title || 'Oakwood Systems' });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://oakwoodsys.com' });
    if (content.videoUrls && content.videoUrls.length > 0) {
      // Use first video thumbnail or a default image
      this.metaService.updateTag({ property: 'og:image', content: 'https://oakwoodsys.com/og-image.jpg' });
    }

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: heroSection?.title || 'Oakwood Systems' });
    this.metaService.updateTag({ name: 'twitter:description', content: description });

    // Canonical URL
    let linkTag = document.querySelector('link[rel="canonical"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'canonical');
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', 'https://oakwoodsys.com');
  }

  private updateStructuredData(content: HomeContent) {
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const servicesSection = content.sections?.find(s => s.type === 'services');

    const structuredDataObj = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Oakwood Systems',
      'url': 'https://oakwoodsys.com',
      'description': heroSection?.description || 'Microsoft Solutions Partner',
      'logo': 'https://oakwoodsys.com/logo.png',
      'sameAs': [
        // Add social media links if available
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'Customer Service',
        'url': 'https://oakwoodsys.com/contact-us'
      }
    };

    this.structuredData.set(structuredDataObj);
  }

  getStructuredDataJson(): string {
    const data = this.structuredData();
    return data ? JSON.stringify(data) : '';
  }

  togglePanel() {
    this.panelVisible.set(!this.panelVisible());
  }

  onJsonChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.jsonContent = target.value;

    try {
      const parsed = JSON.parse(this.jsonContent);
      this.jsonError.set(null);

      // Update content in real-time
      this.content.set(parsed);

      // Update video URLs if present
      if (parsed.videoUrls && parsed.videoUrls.length > 0) {
        this.videoUrls.set(parsed.videoUrls);
      }

      // Update metadata and structured data
      this.updateMetadata(parsed);
      this.updateStructuredData(parsed);
    } catch (error) {
      this.jsonError.set('JSON inválido: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  saveContent() {
    if (!this.content() || this.jsonError()) return;

    this.saving.set(true);
    this.saveSuccess.set(false);

    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('admin_token') : null;
    if (!token) {
      console.error('No admin token found');
      this.saving.set(false);
      return;
    }

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Parse JSON content to send
    let updatedContent: HomeContent;
    try {
      updatedContent = JSON.parse(this.jsonContent);
    } catch (error) {
      alert('Error: JSON inválido. No se puede guardar.');
      this.saving.set(false);
      return;
    }

    this.http.put<{ success: boolean; message?: string }>('/api/home-content', updatedContent, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local content signal
          this.content.set(updatedContent);
          this.saveSuccess.set(true);

          // Hide success message after 3 seconds
          setTimeout(() => {
            this.saveSuccess.set(false);
          }, 3000);
        } else {
          console.error('Failed to save:', response.message);
          alert('Error al guardar: ' + (response.message || 'Error desconocido'));
        }
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error saving content:', error);
        alert('Error al guardar el contenido. Por favor intenta de nuevo.');
        this.saving.set(false);
      }
    });
  }
}
