import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";
import { VideoHero } from '../../shared/video-hero/video-hero';

@Component({
  selector: 'app-structured',
  imports: [RouterLink, VideoHero,CtaSectionComponent],
  templateUrl: './structured.html',
  styleUrl: './structured.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Structured {
  readonly heroVideoUrls = [
    'https://oakwoodsys.com/wp-content/uploads/2026/02/Services-Data-Ai.mp4'
  ];
  readonly heroTitle = 'Structured Engagements';
  readonly heroDescription = 'Drive efficiency and innovation with tailored, strategic engagements designed to align technology solutions with your unique business goals.';
  readonly heroCtaPrimary = {
    text: 'View Offers',
    link: '/structured-engagement',
    backgroundColor: '#2A7EBF'
  };
}

