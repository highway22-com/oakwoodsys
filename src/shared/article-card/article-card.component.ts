import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ArticleCardArticle {
  id?: number;
  title?: string;
  description?: string;
  link?: string;
  linkText?: string;
  readingTime?: string;
  image?: { url?: string; alt?: string };
  tags?: string[];
}

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent {
  readonly article = input.required<ArticleCardArticle>();
}
