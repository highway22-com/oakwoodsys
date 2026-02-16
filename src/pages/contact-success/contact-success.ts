import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OfficeLocationsSectionComponent } from '../../shared/office-locations-section/office-locations-section.component';
import { CTA_GRADIENTS, CtaSectionComponent } from '../../shared/cta-section/cta-section.component';

@Component({
  selector: 'app-contact-success',
  imports: [OfficeLocationsSectionComponent, CtaSectionComponent],
  templateUrl: './contact-success.html',
  styleUrl: './contact-success.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSuccess {
  readonly licensingGradient = CTA_GRADIENTS[4];
  readonly heroTitle = 'Thanks for reaching out.';
  readonly heroSubtitle = "We'll be in touch soon.";
  readonly heroCopy = 'We received your message and our team will review it shortly.';
}
