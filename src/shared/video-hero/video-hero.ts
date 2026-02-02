import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Input, OnChanges, OnDestroy, PLATFORM_ID, signal, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

/** URLs de video placeholder mientras carga el contenido (se sustituyen por GraphQL). */
const PLACEHOLDER_VIDEO_URLS: string[] = [
  'https://oakwoodsys.com/wp-content/uploads/2025/12/home.mp4',
  'https://oakwoodsys.com/wp-content/uploads/2025/12/1.mp4',
  'https://oakwoodsys.com/wp-content/uploads/2025/12/2.mp4',
  'https://oakwoodsys.com/wp-content/uploads/2025/12/4.mp4',
];

@Component({
  selector: 'app-video-hero',
  imports: [CommonModule, RouterLink],
  templateUrl: './video-hero.html',
  styleUrl: './video-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoHero implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  @Input() loading = true;
  @Input() videoUrls: string[] = [];
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() ctaPrimary?: { text: string; link: string; backgroundColor: string };
  @Input() ctaSecondary?: { text: string; link: string; borderColor: string };
  /** Centra título, descripción y CTAs (ej. página Contact Us). */
  @Input() centerContent = false;

  private readonly platformId = inject(PLATFORM_ID);
  private videoInterval: any;

  /** Mientras loading o sin URLs del CMS, usar placeholders; si no, URLs de GraphQL. */
  readonly videoUrlsSignal = signal<string[]>(PLACEHOLDER_VIDEO_URLS);
  readonly currentVideoIndex = signal(0);
  readonly currentVideoUrl = computed(() => {
    const urls = this.videoUrlsSignal();
    const index = this.currentVideoIndex();
    return urls[index] || urls[0] || '';
  });

  ngOnChanges(changes: SimpleChanges) {
    const usePlaceholders = this.loading || !this.videoUrls || this.videoUrls.length === 0;
    const urls = usePlaceholders ? PLACEHOLDER_VIDEO_URLS : this.videoUrls;
    this.videoUrlsSignal.set(urls);
    // No llamar loadVideo aquí: en SSR o antes de AfterViewInit el video no existe; se carga en ngAfterViewInit.
    if (changes['videoUrls'] || changes['loading']) {
      if (isPlatformBrowser(this.platformId) && this.videoElement?.nativeElement && typeof this.videoElement.nativeElement.load === 'function') {
        const initialUrl = this.currentVideoUrl();
        if (initialUrl) {
          this.loadVideo(initialUrl);
        }
      }
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', () => this.enableAutoplay(), { once: true });
    }

    // URLs: placeholders si loading o sin videoUrls; si no, los del input
    const usePlaceholders = this.loading || !this.videoUrls || this.videoUrls.length === 0;
    this.videoUrlsSignal.set(usePlaceholders ? PLACEHOLDER_VIDEO_URLS : this.videoUrls);

    setTimeout(() => {
      if (this.videoElement && this.videoUrlsSignal().length > 0) {
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
    }, 11000);
  }

  switchToVideo(index: number) {
    const urls = this.videoUrlsSignal();
    if (index >= 0 && index < urls.length) {
      this.currentVideoIndex.set(index);
      this.loadVideo(urls[index]);

      // Reset the carousel timer
      this.startVideoCarousel();
    }
  }

  private nextVideo() {
    const urls = this.videoUrlsSignal();
    const currentIndex = this.currentVideoIndex();
    const nextIndex = (currentIndex + 1) % urls.length;
    this.switchToVideo(nextIndex);
  }

  private loadVideo(url: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.videoElement?.nativeElement) return;
    const video = this.videoElement.nativeElement;
    if (typeof video.load !== 'function') return;

    video.src = url;
    video.load();

    video.addEventListener('loadeddata', () => {
      this.attemptAutoplay();
    }, { once: true });
  }
}
