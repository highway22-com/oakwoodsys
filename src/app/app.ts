import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbar } from "../layout/app-navbar/app-navbar";
import { Footer } from "../layout/footer/footer";
import { CookieConsentBanner } from "../shared/cookie-consent-banner/cookie-consent-banner";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar, Footer, CookieConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oaw');
}
