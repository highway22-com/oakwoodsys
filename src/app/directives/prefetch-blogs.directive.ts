import { Directive, HostListener, inject, input } from '@angular/core';
import { GraphQLContentService } from '../services/graphql-content.service';

/** En mouseenter, precarga la primera página de blogs (Apollo cache). Al navegar a /blog se usa caché. */
@Directive({
  selector: '[prefetchBlogs]',
  standalone: true,
})
export class PrefetchBlogsDirective {
  private readonly graphql = inject(GraphQLContentService);

  /** Si false, no hace prefetch. Por defecto true. */
  prefetchBlogs = input<boolean>(true);

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.prefetchBlogs()) {
      this.graphql.prefetchBlogs();
    }
  }
}
