import {
  Component,
  Input,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonPrimaryComponent } from '../../button-primary/button-primary.component';

@Component({
  selector: 'app-contact-form-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonPrimaryComponent],
  templateUrl: './contact-form-section.html',
  styleUrls: ['./contact-form-section.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormSectionComponent {
  @Input() backgroundImageUrl: string = '';
  @Input() imageUrl: string =
    'https://oakwoodsystemsgroup.com/wp-content/uploads/2026/02/contactus.png';
  @Input() title: string = "Let's bring your Ideas to life";
  @Input() description: string =
    "Tell us a bit about your project and we'll reach out to help you make it a reality.";
  @Input() buttonText: string = 'Get started with us';

  @ViewChild('recaptchaHost') recaptchaHost!: ElementRef;

  formModel = { fullName: '', email: '', message: '' };
  submitted = false;
  isSubmitting = false;
  validationErrors = { fullName: false, email: false, message: false };

  submitSuccess = signal(false);
  submitError = signal(false);

  constructor(private http: HttpClient) {}

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onSubmit() {
    this.submitted = true;
    this.validationErrors = {
      fullName: !this.formModel.fullName.trim(),
      email:
        !this.formModel.email.trim() || !this.isValidEmail(this.formModel.email),
      message: !this.formModel.message.trim(),
    };

    if (
      this.validationErrors.fullName ||
      this.validationErrors.email ||
      this.validationErrors.message
    ) {
      return;
    }

    this.isSubmitting = true;
    this.submitError.set(false);

    this.http
      .post('/api/contact', {
        fullName: this.formModel.fullName.trim(),
        email: this.formModel.email.trim(),
        company: 'Not provided',
        message: this.formModel.message.trim(),
      })
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.isSubmitting = false;
          this.formModel = { fullName: '', email: '', message: '' };
          this.submitted = false;
        },
        error: () => {
          this.submitError.set(true);
          this.isSubmitting = false;
        },
      });
  }
}
