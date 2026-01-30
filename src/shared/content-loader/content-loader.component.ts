import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-content-loader',
  standalone: true,
  templateUrl: './content-loader.component.html',
  styleUrl: './content-loader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentLoaderComponent {
  readonly loading = input<boolean>(false);
  readonly error = input<unknown>(null);
  readonly hasContent = input<boolean>(false);
  readonly notFoundMessage = input<string>('No data for this page ');
  readonly errorMessage = input<string>('.');
}
