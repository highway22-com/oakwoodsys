import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Un ítem del breadcrumb: label y opcionalmente routerLink (si no hay link, es la página actual). */
export interface PageHeroBreadcrumb {
  label: string;
  routerLink?: string;
}

@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-hero.component.html',
  styleUrl: './page-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeroComponent {
  /** Breadcrumbs: último ítem sin routerLink = página actual. */
  @Input() breadcrumbs: PageHeroBreadcrumb[] = [];

  /** URL de la imagen de fondo. */
  @Input() bgImage = '';

  /** Título principal (h1). */
  @Input() mainText = '';

  /** Subtítulo (párrafo bajo el título). */
  @Input() subtitle = '';
}
