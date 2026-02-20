import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonPrimaryComponent } from "../../shared/button-primary/button-primary.component";

@Component({
  selector: 'app-page404',
  imports: [RouterLink, ButtonPrimaryComponent],
  templateUrl: './page404.html',
})
export default class Page404 { }
