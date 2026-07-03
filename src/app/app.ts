import { ViewportScroller } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieConsentBanner } from "../shared/cookie-consent-banner/cookie-consent-banner";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CookieConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly viewportScroller = inject(ViewportScroller);
  protected readonly title = signal('oaw');

  constructor() {
    this.viewportScroller.setOffset([0, 120]);
  }
}
