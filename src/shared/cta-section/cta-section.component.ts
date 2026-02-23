import { ChangeDetectionStrategy, Component, computed, input , OnInit} from '@angular/core';
import { ButtonPrimaryComponent } from "../button-primary/button-primary.component";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
/** Lista de fondos para la sección CTA. Índice 0 = primero (45° derecha a izquierda). */
export const CTA_GRADIENTS: readonly string[] = [
  /* 1: derecha a izquierda, 45°, #F0F7FA → #E5F2F7 → #E9ECF7 → #EDE6F6 */
  'linear-gradient(45deg, #F0F7FA, #E5F2F7, #E9ECF7, #EDE6F6)',
  /* 2: misma paleta, 135° */
  'linear-gradient(135deg, #FBFAFA, #FAE9DB, #F9E4E5, #EFE7F0)',
  /* 3: misma paleta, 225° */
  'linear-gradient(225deg, #EBF7F9, #DBF0F4, #D2F0E8, #DCF5E2)',
  /* 4: misma paleta, 315° */
  'linear-gradient(315deg, #D2E8F5, #E8DCE8, #EFDBD5, #F7E1B9)',
  /* 5: color sólido vía variable de diseño */
  'linear-gradient(135deg, #EEF2FF, #FFFFFF, #FFE4E6)',
];

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [ButtonPrimaryComponent, CommonModule],
  templateUrl: './cta-section.component.html',
  styleUrl: './cta-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSectionComponent {
  /** Título principal de la sección. */
  readonly title = input<string>('');
  /** Párrafo descriptivo. */
  readonly description = input<string>('');
  /** Texto del botón primario. */
  readonly primaryText = input<string>('');
  /** URL o ruta del botón primario (routerLink). */
  readonly primaryLink = input<string>('/contact-us');
  /** Texto del botón secundario. */
  readonly secondaryText = input<string>('');
  /** URL o ruta del botón secundario (routerLink). */
  readonly secondaryLink = input<string>('/contact-us');

  /** Índice del fondo en CTA_GRADIENTS. Por defecto 0. */
  readonly gradientIndex = input<number>(0);
  /** Valor de gradiente explícito; si existe, tiene prioridad sobre gradientIndex. */
  readonly backgroundGradientValue = input<string>('');
   bgImg: string = '';
  isIndustries: boolean = false;
  isElse: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    const url = this.router.url;
    if (url === '/' || url === '/home') {
      this.bgImg = '/bg-imgs/home-page-bg.jpg';
    } else if (url.includes('services')) {
      this.bgImg = '/bg-imgs/services-page-bg.jpg';
    } else if (url.includes('industries')) {
      this.bgImg = '/bg-imgs/industries-page-bg.jpg';
    } else {
      this.bgImg = '/bg-imgs/home-page-bg.jpg';
    }
  }

  /** Gradiente de fondo efectivo según gradientIndex. */
  readonly backgroundGradient = computed(() =>
    this.backgroundGradientValue().trim() || (CTA_GRADIENTS[this.gradientIndex()] ?? CTA_GRADIENTS[0])
  );
}
