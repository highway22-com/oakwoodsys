import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-structured',
  imports: [RouterLink],
  templateUrl: './structured.html',
  styleUrl: './structured.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Structured { }
