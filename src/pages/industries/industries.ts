import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-industries',
  imports: [CommonModule],
  templateUrl: './industries.html',
  styleUrl: './industries.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Industries {
  slug: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.slug = this.route.snapshot.paramMap.get('slug');
  }
}
