import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo, gql } from 'apollo-angular';

interface PostAuthor {
  node: {
    email: string;
    firstName: string;
    id: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  author: PostAuthor;
  sanitizedContent?: SafeHtml;
}

@Component({
  selector: 'app-bloq',
  imports: [RouterLink, CommonModule, DatePipe],
  templateUrl: './bloq.html',
  styleUrl: './bloq.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bloq implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly sanitizer = inject(DomSanitizer);
  readonly posts = signal<{ nodes: Post[] } | null>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);

  ngOnInit() {
    this.apollo
      .watchQuery({
        query: gql`
         query post {
            posts {
              nodes {
                id
                title
                content
                excerpt
                slug
                date
                author {
                  node {
                    email
                    firstName
                    id
                  }
                }
              }
            }
          }
        `,
      })
      .valueChanges.subscribe((result: any) => {
        console.log(result);
        if (result.data?.posts?.nodes) {
          // Transform posts to include sanitized HTML content
          const transformedPosts = {
            nodes: result.data.posts.nodes.map((post: Post) => ({
              ...post,
              sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(post.content || '')
            }))
          };
          this.posts.set(transformedPosts);
        } else {
          this.posts.set(result.data?.posts);
        }
        this.loading.set(false);
        this.error.set(result.error);
      });
  }
}
