import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieConsentBanner } from "../shared/cookie-consent-banner/cookie-consent-banner";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CookieConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oaw');
}
