import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-scroll-animation',
  standalone: true,
  templateUrl: './scroll-animation.component.html',
  styleUrls: ['./scroll-animation.component.css']
})
export class ScrollAnimationComponent  {
  
  @Input() isVisible = false;
  reverse = false;

  private prevVisible = false;


}
