import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact-success',
  imports: [RouterLink],
  templateUrl: './contact-success.html',
  styleUrl: './contact-success.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSuccess {
  readonly heroTitle = 'Thanks for reaching out.';
  readonly heroSubtitle = "We'll be in touch soon.";
  readonly heroCopy = 'We received your message and our team will review it shortly.';
}
