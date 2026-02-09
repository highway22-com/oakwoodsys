import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ButtonPrimaryComponent } from "../button-primary/button-primary.component";

/** Lista de 4 gradientes para fondo de la sección CTA. Índice 0 = primero (45° derecha a izquierda). */
export const CTA_GRADIENTS: readonly string[] = [
  /* 1: derecha a izquierda, 45°, #F0F7FA → #E5F2F7 → #E9ECF7 → #EDE6F6 */
  'linear-gradient(45deg, #F0F7FA, #E5F2F7, #E9ECF7, #EDE6F6)',
  /* 2: misma paleta, 135° */
  'linear-gradient(135deg, #FBFAFA, #FAE9DB, #F9E4E5, #EFE7F0)',
  /* 3: misma paleta, 225° */
  'linear-gradient(225deg, #EBF7F9, #DBF0F4, #D2F0E8, #DCF5E2)',
  /* 4: misma paleta, 315° */
  'linear-gradient(315deg, #D2E8F5, #E8DCE8, #EFDBD5, #F7E1B9)',
];

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [ButtonPrimaryComponent],
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

  /** Índice del gradiente de fondo (0–3). Por defecto 0 = 45° derecha a izquierda. */
  readonly gradientIndex = input<number>(0);
  /** Gradiente de fondo efectivo según gradientIndex. */
  readonly backgroundGradient = computed(() =>
    CTA_GRADIENTS[this.gradientIndex()] ?? CTA_GRADIENTS[0]
  );
}
