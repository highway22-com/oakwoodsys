import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbar } from "../layout/app-navbar/app-navbar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oaw');
}
