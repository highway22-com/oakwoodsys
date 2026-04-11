import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { SafeHtml } from '@angular/platform-browser';
import { decodeHtmlEntities } from '../../app/utils/cast';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent {
  readonly decodeHtmlEntities = decodeHtmlEntities;

  readonly slug = input.required<string>();
  readonly linkBase = input<string>('/resources/events');
  readonly imageUrl = input<string>('');
  readonly imageAlt = input<string>('Event card image');
  readonly badgeMonth = input<string>('');
  readonly badgeDay = input<string>('');
  readonly tag = input<string | null>(null);
  readonly statusType = input<'online' | 'in-person'>('online');
  readonly location = input<string>('');
  readonly eventDate = input<string>('');
  readonly eventTime = input<string>('');
  readonly title = input<string>('');
  readonly excerptHtml = input<SafeHtml | null>(null);
  readonly authorDisplayName = input<string | null>(null);
  readonly authorPicture = input<string | null>(null);
  readonly authorInitial = input<string>('A');
  readonly date = input<string>('');
  readonly readMoreText = input<string>('View details');

  readonly defaultImageUrl = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80';
  readonly effectiveImageUrl = () => this.imageUrl() || this.defaultImageUrl;
  readonly statusIconUrl = () =>
    this.statusType() === 'in-person' ? '/assets/events/in-person.png' : '/assets/events/online.png';
}
