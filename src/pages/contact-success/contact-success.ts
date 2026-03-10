import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { OfficeLocationsSectionComponent } from '../../shared/office-locations-section/office-locations-section.component';
import { CTA_GRADIENTS, CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { SeoMetaService } from '../../app/services/seo-meta.service';

@Component({
  selector: 'app-contact-success',
  imports: [OfficeLocationsSectionComponent, CtaSectionComponent],
  templateUrl: './contact-success.html',
  styleUrl: './contact-success.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSuccess implements OnInit {
  private readonly seoMeta = inject(SeoMetaService);
  readonly licensingGradient = CTA_GRADIENTS[4];
  readonly heroTitle = 'Thanks for reaching out.';
  readonly heroSubtitle = "We'll be in touch soon.";
  readonly heroCopy = 'We received your message and our team will review it shortly.';

  ngOnInit() {
    this.seoMeta.updateMeta({
      title: 'Contact Success | Oakwood Systems',
      description: "Thank you for contacting Oakwood Systems. We've received your message and our team will be in touch soon.",
      canonicalPath: '/contact-success',
    });
  }
}
