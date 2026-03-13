import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

export interface EditableItem {
  label: string;
  slug: string;
  /** Ruta a la que navegar con ?edit=true. Para home es '/', para otros es /edit/:slug */
  editPath: string;
}

@Component({
  selector: 'app-edit-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './edit-dashboard.html',
  styleUrl: './edit-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditDashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly editMode = signal(false);
  readonly editableItems: EditableItem[] = [
    { label: 'Home', slug: 'home', editPath: '/' },
    { label: 'Footer', slug: 'footer', editPath: '/edit/footer' },
    { label: 'Menu', slug: 'menu', editPath: '/edit/menu' },
    { label: 'Industries', slug: 'industries', editPath: '/edit/industries' },
    { label: 'Services', slug: 'services', editPath: '/edit/services' },
    { label: 'Resources', slug: 'resources', editPath: '/edit/resources' },
    { label: 'Structured Engagements', slug: 'structured-engagements', editPath: '/edit/structured-engagements' },
    { label: 'About', slug: 'about', editPath: '/edit/about' },
  ];

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const enabled = params['edit'] === 'true';
        this.editMode.set(enabled);
        if (!enabled) {
          this.router.navigate(['/edit'], { queryParams: { edit: 'true' } });
        }
      });
  }
}
