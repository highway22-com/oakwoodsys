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
  /** Color de fondo (ej. hex). Si no se define, se usa la clase por defecto bg-p-700. */
  readonly backgroundColor = input<string | undefined>(undefined);
  /** Si es true, el fondo es transparente (útil con borde). */
  readonly isTransparent = input<boolean>(false);
  /** Color del borde: 'white' o 'black'. Si no se define, no se muestra borde. */
  readonly borderColor = input<'white' | 'black' | undefined>(undefined);

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
