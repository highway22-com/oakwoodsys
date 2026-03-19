import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { ButtonPrimaryComponent } from '../../shared/button-primary/button-primary.component';

export interface EditableItem {
  label: string;
  slug: string;
  /** Ruta a la que navegar con ?edit=true. Para home es '/', para otros es /edit/:slug */
  editPath: string;
}

@Component({
  selector: 'app-edit-dashboard',
  imports: [CommonModule, RouterLink, ButtonPrimaryComponent],
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
    { label: 'Home', slug: 'home', editPath: '/edit/home' },
    { label: 'Footer', slug: 'footer', editPath: '/edit/footer' },
    { label: 'Menu', slug: 'menu', editPath: '/edit/menu' },
    { label: 'Industries', slug: 'industries', editPath: '/edit/industries' },
    { label: 'Services', slug: 'services', editPath: '/edit/services' },
    { label: 'Resources', slug: 'resources', editPath: '/edit/resources' },
    { label: 'Structured Engagement Page', slug: 'structured-engagement-page', editPath: '/edit/structured-engagement-page' },
    { label: 'Structured Engagement Offer Page', slug: 'structured-engagement-offer-page', editPath: '/edit/structured-engagement-offer-page' },
    { label: 'About Us', slug: 'about', editPath: '/edit/about' },
    { label: 'Contact Us', slug: 'contact-us', editPath: '/edit/contact-us' },
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
