import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-scroll-animation',
  standalone: true,
  templateUrl: './scroll-animation.component.html',
  styleUrls: ['./scroll-animation.component.css']
})
export class ScrollAnimationComponent implements OnChanges {
  @Input() isVisible = false;
  reverse = false;

  private prevVisible = false;

  ngOnChanges(changes: SimpleChanges) {
    if ('isVisible' in changes) {
      if (this.prevVisible && !this.isVisible) {
        this.reverse = true;
      } else {
        this.reverse = false;
      }
      this.prevVisible = this.isVisible;
    }
  }
}
