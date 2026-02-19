import { Component, Input } from '@angular/core';
import { SafeUrlPipe } from './safe-url.pipe';

@Component({
  selector: 'app-youtube-player',
  standalone: true,
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.css'],
  imports: [SafeUrlPipe],
})
export class YoutubePlayerComponent {
  @Input() videoId: string = '';
  played = false;

  get videoUrl() {
    return `https://www.youtube.com/embed/${this.videoId}?autoplay=1`;
  }

  playVideo() {
    this.played = true;
  }
}
