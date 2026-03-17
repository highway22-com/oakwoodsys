import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbar } from '../app-navbar/app-navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, AppNavbar, Footer],
  templateUrl: './main-layout.html',
})
export class MainLayout {}
