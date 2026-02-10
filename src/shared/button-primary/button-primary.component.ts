import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-button-primary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './button-primary.component.html',
  styleUrl: './button-primary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPrimaryComponent {
  /** Texto del botón. */
  readonly text = input<string>('');
  /** Si se define, se renderiza como enlace con routerLink en lugar de botón. */
  readonly link = input<string | undefined>(undefined);
  /** Color de fondo (ej. hex o var(--color-p-700)). Si no se define, se usa var(--color-p-700). */
  readonly backgroundColor = input<string | undefined>(undefined);
  /** Si es true, se usa el color por defecto del tema (var(--color-p-700)); si es false, se usa backgroundColor si se pasó. */
  readonly isBgDefault = input<boolean>(true);
  /** Si es true, el fondo es transparente (útil con borde). */
  readonly isTransparent = input<boolean>(false);
  /** Color del borde: 'white' o 'black'. Si no se define, no se muestra borde. */
  readonly borderColor = input<'white' | 'black' | undefined>(undefined);

  /** Color de fondo efectivo. */
  readonly effectiveBackgroundColor = computed(() => {
    if (this.isTransparent()) return 'transparent';
    if (this.isBgDefault()) return 'var(--color-p-700)';
    return this.backgroundColor() ?? 'var(--color-p-700)';
  });

  /** Clases del trigger (un solo binding en el template). */
  readonly triggerClasses = computed(() => {
    const base = 'group font-normal transition-all duration-200 whitespace-nowrap shadow-none button-primary__trigger';
    const border = this.borderColor();
    const mods: string[] = [];
    if (this.isTransparent()) mods.push('');
    if (border === 'white') mods.push('border-white text-white borer-solid border-1');
    else if (border === 'black') mods.push(' border-black text-black borer-solid border-1');
    else mods.push('text-white');
    return [base, ...mods].join(' ');
  });

  @Output() readonly buttonClick = new EventEmitter<void>();
}
