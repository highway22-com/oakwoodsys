import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resources',
  imports: [CommonModule],
  templateUrl: './resources.html',
  styleUrl: './resources.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resources {
  slug: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.slug = this.route.snapshot.paramMap.get('slug');
  }
}
