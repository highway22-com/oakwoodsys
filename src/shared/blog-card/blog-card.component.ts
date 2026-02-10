import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCardComponent {
  /** Slug del post. Con linkBase por defecto ruta: /blog/{{ slug }}. */
  readonly slug = input.required<string>();
  /** Segmento base de la ruta (sin slug). Por defecto '/blog'. Ej: '/resources/case-studies'. */
  readonly linkBase = input<string>('/blog');
  /** URL de la imagen destacada. */
  readonly imageUrl = input<string>('');
  /** Alt de la imagen. */
  readonly imageAlt = input<string>('Blog post');
  /** Etiqueta principal (tag badge). Si vacío, no se muestra. */
  readonly tag = input<string | null>(null);
  /** Tiempo de lectura en minutos. */
  readonly readingTimeMinutes = input<number>(1);
  /** Título del post. */
  readonly title = input<string>('');
  /** Extracto o contenido (HTML ya sanitizado). */
  readonly excerptHtml = input<SafeHtml | null>(null);
  /** Nombre del autor a mostrar. Si null/undefined, no se muestra bloque autor. */
  readonly authorDisplayName = input<string | null>(null);
  /** URL de la foto del autor. Si no hay, se muestra inicial. */
  readonly authorPicture = input<string | null>(null);
  /** Inicial del autor (una letra) cuando no hay foto. */
  readonly authorInitial = input<string>('A');
  /** Fecha del post (se formatea con DatePipe MMM d, y). */
  readonly date = input<string>('');
  /** Texto del enlace "Read more". */
  readonly readMoreText = input<string>('Read more');

  /** URL de imagen por defecto cuando no hay featuredImage. */
  readonly defaultImageUrl = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80';
  readonly effectiveImageUrl = () => this.imageUrl() || this.defaultImageUrl;
}
