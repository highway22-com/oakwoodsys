import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoMetaService } from '../../app/services/seo-meta.service';

@Component({
  selector: 'app-contact-success',
  imports: [RouterLink],
  templateUrl: './contact-success.html',
  styleUrl: './contact-success.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSuccess implements OnInit {
  private readonly seoMeta = inject(SeoMetaService);

  ngOnInit() {
    this.seoMeta.updateMeta({
      title: 'Message Received | Oakwood Systems',
      description: "Thanks for reaching out. We'll be in touch soon.",
      canonicalPath: '/contact-success',
    });
  }
  readonly heroTitle = 'Thanks for reaching out.';
  readonly heroSubtitle = "We'll be in touch soon.";
  readonly heroCopy = 'We received your message and our team will review it shortly.';
}
