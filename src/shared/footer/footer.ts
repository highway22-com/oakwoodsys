import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface FooterPolicy {
  text: string;
  link: string;
}

@Component({
  selector: 'app-simple-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  currentYear = new Date().getFullYear();
  readonly copyright = input<string | null>(null);
  readonly policies = input<FooterPolicy[] | null>(null);

  readonly defaultPolicies: FooterPolicy[] = [
    { text: 'Privacy policy', link: '/privacy-policy' },
  ];

  get displayCopyright(): string {
    return this.copyright() ?? `© ${this.currentYear} Oakwood Systems Group, Inc. All Right Reserved.`;
  }

  get displayPolicies(): FooterPolicy[] {
    const p = this.policies();
    return (p && p.length > 0) ? p : this.defaultPolicies;
  }
}
