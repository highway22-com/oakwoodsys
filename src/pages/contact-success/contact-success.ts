import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { OfficeLocationsSectionComponent } from '../../shared/office-locations-section/office-locations-section.component';
import { CTA_GRADIENTS, CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import {
  ContactPageContentService,
  type ContactSuccessCopy,
  type ContactStat,
  type ContactCta,
  type OfficeLocationsContent,
  DEFAULT_CONTACT_SUCCESS_COPY,
  DEFAULT_CONTACT_STATS,
  DEFAULT_LICENSING_CTA,
  DEFAULT_CONTACT_SUCCESS_SEO,
  DEFAULT_OFFICE_LOCATIONS,
} from '../../app/services/contact-page-content.service';

@Component({
  selector: 'app-contact-success',
  imports: [OfficeLocationsSectionComponent, CtaSectionComponent],
  templateUrl: './contact-success.html',
  styleUrl: './contact-success.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSuccess implements OnInit {
  private readonly seoMeta = inject(SeoMetaService);
  private readonly contactContent = inject(ContactPageContentService);
  readonly licensingGradient = CTA_GRADIENTS[4];
  readonly copy = signal<ContactSuccessCopy>(DEFAULT_CONTACT_SUCCESS_COPY);
  readonly stats = signal<ContactStat[]>(DEFAULT_CONTACT_STATS);
  readonly licensingCtaCopy = signal<ContactCta>(DEFAULT_LICENSING_CTA);
  readonly officeLocations = signal<OfficeLocationsContent>(DEFAULT_OFFICE_LOCATIONS);

  ngOnInit() {
    this.loadContent();
    const seo = DEFAULT_CONTACT_SUCCESS_SEO;
    this.seoMeta.updateMeta({
      title: seo.title,
      description: seo.description,
      canonicalPath: '/contact-success',
    });
  }

  private loadContent() {
    this.contactContent.getContent().subscribe({
      next: (data) => {
        if (!data) return;
        if (data.contactSuccess) {
          this.copy.set(data.contactSuccess as ContactSuccessCopy);
        }
        if (data.shared?.stats?.length) {
          this.stats.set(data.shared.stats as ContactStat[]);
        }
        if (data.shared?.licensingCta) {
          this.licensingCtaCopy.set(data.shared.licensingCta);
        }
        if (data.shared?.officeLocations) {
          this.officeLocations.set(data.shared.officeLocations);
        }
        const seo = data.seo?.contactSuccess ?? DEFAULT_CONTACT_SUCCESS_SEO;
        this.seoMeta.updateMeta({
          title: seo.title,
          description: seo.description,
          canonicalPath: '/contact-success',
        });
      },
      error: () => {
        // Keep defaults when content file is unavailable.
      },
    });
  }
}
