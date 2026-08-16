import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import type { SafeHtml } from '@angular/platform-browser';
import { decodeHtmlEntities } from '../../app/utils/cast';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink, NgOptimizedImage],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent {
  // Format duration as HH:mm:ss for past event badge
  readonly formattedDurationHMS = () => {
    const minutes = this.durationMinutes();
    if (
      minutes === null ||
      minutes === undefined ||
      !Number.isFinite(minutes) ||
      minutes <= 0
    )
      return null;
    const totalSeconds = Math.round(minutes * 60);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Returns true if the event is in the past
  readonly isPastEvent = (): boolean => {
    const end = this.parseIsoDate(this.eventEndISO());
    if (!end) return false;
    return end.getTime() < Date.now();
  };

  readonly decodeHtmlEntities = decodeHtmlEntities;
  readonly queryParams = input<Record<string, any> | undefined>(undefined);
  readonly slug = input.required<string>();
  readonly linkBase = input<string>('/resources/events');
  readonly imageUrl = input<string>('');
  readonly imageAlt = input<string>('Event card image');
  readonly tag = input<string | null>(null);
  readonly statusType = input<'online' | 'in-person'>('online');
  readonly location = input<string>('');
  readonly eventStartISO = input<string | null>(null);
  readonly eventEndISO = input<string | null>(null);
  readonly eventTimeZone = input<string | null>(null); // NEW
  readonly durationMinutes = input<number | null>(null);
  readonly title = input<string>('');
  readonly excerptHtml = input<SafeHtml | null>(null);
  readonly authorDisplayName = input<string | null>(null);
  readonly authorPicture = input<string | null>(null);
  readonly authorInitial = input<string>('A');
  readonly date = input<string>('');
  readonly readMoreText = input<string>('View details');

  readonly defaultImageUrl =
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80';
  readonly effectiveImageUrl = () => this.imageUrl() || this.defaultImageUrl;
  readonly statusIconUrl = () =>
    this.statusType() === 'in-person'
      ? '/assets/events/in-person.png'
      : '/assets/events/online.png';

  private parseIsoDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  // Uses event's own timezone from BE if available, else falls back to browser timezone
  private viewerTimeZoneId(): string | undefined {
    return (
      this.eventTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }

  private calendarDayKey(d: Date): string {
    const tz = this.viewerTimeZoneId();
    if (!tz) {
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  private dateFmtOpts(): Intl.DateTimeFormatOptions {
    const tz = this.viewerTimeZoneId();
    const base: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return tz ? { ...base, timeZone: tz } : base;
  }

  private timeFmtOpts(): Intl.DateTimeFormatOptions {
    const tz = this.viewerTimeZoneId();
    const base: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'shortGeneric',
    };
    return tz ? { ...base, timeZone: tz } : base;
  }

  readonly formattedDate = () => {
    const start = this.parseIsoDate(this.eventStartISO());
    if (!start) return null;

    const tz = this.viewerTimeZoneId();
    const dateFmt = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(tz ? { timeZone: tz } : {}),
    });

    return dateFmt.format(start);
  };

  readonly formattedTime = () => {
    const start = this.parseIsoDate(this.eventStartISO());
    if (!start) return null;

    const tz = this.viewerTimeZoneId();
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
      ...(tz ? { timeZone: tz } : {}),
    };
    const timeFmt = new Intl.DateTimeFormat('en-US', opts);

    const end = this.parseIsoDate(this.eventEndISO());
    if (!end) {
      return timeFmt.format(start).replace(',', '');
    }

    const startParts = timeFmt.formatToParts(start);
    const endParts = timeFmt.formatToParts(end);
    const startHour =
      startParts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') ?? '';
    const startMinute =
      startParts.find((p) => p.type === 'minute')?.value ?? '';
    const startDayPeriod =
      startParts.find((p) => p.type === 'dayPeriod')?.value ?? '';
    const endHour =
      endParts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') ?? '';
    const endMinute = endParts.find((p) => p.type === 'minute')?.value ?? '';
    const endDayPeriod =
      endParts.find((p) => p.type === 'dayPeriod')?.value ?? '';
    const tzName =
      startParts.find((p) => p.type === 'timeZoneName')?.value ?? '';

    let timeStr = '';
    if (startDayPeriod === endDayPeriod) {
      timeStr = `${startHour}:${startMinute} - ${endHour}:${endMinute} ${endDayPeriod} ${tzName}`;
    } else {
      timeStr = `${startHour}:${startMinute} ${startDayPeriod} - ${endHour}:${endMinute} ${endDayPeriod} ${tzName}`;
    }
    return timeStr.trim();
  };

  readonly formattedDuration = () => {
    const minutes = this.durationMinutes();
    if (minutes === null || minutes === undefined) return null;
    if (!Number.isFinite(minutes) || minutes <= 0) return null;

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hrs <= 0) return `${minutes}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  readonly eventBadge = (): { month: string; day: string } | null => {
    const start = this.parseIsoDate(this.eventStartISO());
    if (!start) return null;
    const tz = this.viewerTimeZoneId();
    const tzOpts = tz ? ({ timeZone: tz } as const) : {};
    const monthRaw = new Intl.DateTimeFormat('en', {
      month: 'long',
      ...tzOpts,
    }).format(start);
    const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
    const day = new Intl.DateTimeFormat('en', {
      day: 'numeric',
      ...tzOpts,
    }).format(start);
    return { month, day };
  };
}
